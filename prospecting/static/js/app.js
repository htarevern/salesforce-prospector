var App = Ember.Application.create();

App.Router.map(function() {
    this.route('index', {path: '/'});
    this.route('search', {path: '/search/:sobject/:keyword'});
});

App.Company = Ember.Object.extend({
    companyId: null,
    name: null,
    dunsNumber: null,
    city: null,
    country: null,
    isOwned: null,
    selected: false,
});

App.Contact = Ember.Object.extend({
    contactId: null,
    firstName: null,
    lastName: null,
    email: null,
    phone: null,
    isOwned: null,
    selected: false
});

App.Search = Ember.Object.extend();

App.Search.reopenClass({
    searchCompany: function(companyName) {
        var url = '/search/company/' + companyName;

        return Ember.$.getJSON(url).then(function(response) {
            var companies = Em.A();

            if (response.fields.length > 1) {
                response.fields.forEach(function(company){
                    companies.pushObject(App.Company.create(company));
                });
            }

            return companies;
        });
    },

    searchContact: function(contactName) {
        var url = '/search/contact/' + contactName;
        var contacts = [];

        return Ember.$.getJSON(url).then(function(response) {
            if (response.fields.length > 1) {
                response.fields.forEach(function(contact){
                    contacts.push(App.Contact.create(contact));
                });
            }

            return contacts;
        });
    }
});

App.IndexController = Ember.ObjectController.extend({
    sobject: 'company',
    keyword: null,
    placeholder: 'Company Name',

    actions: {
        changeSearchType: function(sobject) {
            this.set('sobject', sobject.toLowerCase());

            this.set('placeholder', this.get('sobject') === 'company' ? 'Company Name' : 'First Name and Last Name');
        },

        search: function() {
            var keyword = this.get('keyword');

            if (keyword !== '' || keyword !== null) {
                this.transitionToRoute('search', this.get('sobject'), this.get('keyword'));
            }
        },
    }
});

App.SearchRoute = Ember.Route.extend({
    model: function(params) {
        var sobject = params.sobject.toLowerCase();
    
        this.controllerFor('search').setProperties({
            'sobject': sobject,
            'selectedOption': sobject,
            'keyword': params.keyword});

        if (sobject === 'company') {
            return App.Search.searchCompany(params.keyword);
        } else {
            return App.Search.searchContact(params.keyword);
        }
    },
});

App.SearchController = Ember.ArrayController.extend({
    sobject: null,
    keyword: null,
    balance: 0,
    selectedOption: null,

    init: function() {
        this.send('getBalance');
    },

    placeholder: function() {
        return this.get('selectedOption') === 'company' ? 'Company Name' : 'First Name and Last Name';
    }.property('selectedOption'),

    isCompany: function() {
        return this.get('sobject') === 'company';
    }.property('sobject'),

    selectAll: function(key, value) {
        if (value !== undefined) {
            this.get('content').forEach(function (object, index) {
                if (!object.get('isOwned')) {
                    object.set('selected', value);
                }
            }, this);
        }
    }.property(),

    actions: {
        search: function() {
            this.set('sobject', this.get('selectedOption'));
            
            this.transitionToRoute('search', this.get('sobject'), this.get('keyword'));
        },

        changeSearchType: function(sobject) {
            var sobj = sobject.toLowerCase();

            this.set('selectedOption', sobj);
            this.set('keyword', '');
        },

        purchaseCompleted: function() {
            this.send('getBalance');
        },

        getBalance: function(item) {
            var that = this;

            Em.$.getJSON('/getBalance').then(function(response) {
                that.set('balance', response.balance);
            });
        },
    }
});


App.PurchaseItemComponent = Ember.Component.extend({
    actions: {
        singlePurchase: function() {
            var model = this.get('model');
            var sobject = this.get('sobject');
            var url = '/purchase/' + this.get('sobject');
            var ids = [];

            if (sobject === 'company') {
                ids.push(model.get('companyId'));
            } else {
                ids.push(model.get('contactId'));
            }

            var data = JSON.stringify({'ids': ids});
            var that = this;

            Em.$.ajax(url, {
                'type': 'POST',
                'dataType': 'json',
                'data': data,
                'success': function (data, textStatus, jqXHR) {
                    model.setProperties(data.fields[0]);
                    that.sendAction('action');
                }
            });
        },

        multiplePurchase: function() {
            var model = this.get('model');
            var sobject = this.get('sobject');
            var url = '/purchase/' + this.get('sobject');
            var ids = [];

            var items = model.filterProperty('selected', true);

            if (sobject === 'company') {
                items.forEach(function(item, index) {
                    ids.push(item.get('companyId'));
                });
            } else {
                items.forEach(function(item, index) {
                    ids.push(item.get('contactId'));
                });
            }

            var data = JSON.stringify({'ids': ids});
            var that = this;

            Em.$.ajax(url, {
                'type': 'POST',
                'dataType': 'json',
                'data': data,
                'success': function (data, textStatus, jqXHR) {
                    items.forEach(function(item, index) {
                        item.setProperties(data.fields[index]);
                    });

                    that.sendAction('action');
                }
            });

        },
    }
});
