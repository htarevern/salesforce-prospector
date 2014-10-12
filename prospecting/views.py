from django.shortcuts import render_to_response
from django.template import RequestContext
from django.http import HttpResponse
import salesforce as sf
import config
import json


def index_view(request):
    sfdc = sf.Salesforce(domain="na1-blitz03.soma")
    try:
        sfdc.authenticate(
            client_id=config.client_id, client_secret=config.client_secret,
            username=config.username, password=config.password)

        request.session['salesforce'] = sfdc
    except sf.RequestFailed, arg:
        print arg.error_code
        print arg.message
        raise

    return render_to_response(
        'index.html', context_instance=RequestContext(request)) 


def search(request, sobject, name):
    sfdc = request.session['salesforce']
    query = ""

    if (sobject == 'company'):
        query += 'SELECT CompanyId, Name, DunsNumber, City, Country, IsOwned '
        query += 'FROM DatacloudCompany '
        query += 'WHERE Name LIKE \'' + name + '\''
    else:
        name_parts = name.split()

        query += 'SELECT ContactId, FirstName, LastName, Email, Phone, IsOwned '
        query += 'FROM DatacloudContact '
        query += 'WHERE FirstName LIKE \'' + name_parts[0] + '\' '

        if len(name_parts) > 1:
            query += 'AND LastName LIKE \'' + name_parts[1] + '\''

    result = sfdc.query(query)
    records = result['records']

    ctx = {'fields': []}

    for record in records:
        if sobject == 'company':
            ctx["fields"].append({
                "companyId": record["CompanyId"],
                "dunsNumber": record["DunsNumber"],
                "name": record["Name"],
                "city": record["City"],
                "country": record["Country"],
                "isOwned": record["IsOwned"],
                "selected": False
            })
        else:
            ctx["fields"].append({
                "contactId": record["ContactId"],
                "firstName": record["FirstName"],
                "lastName": record["LastName"],
                "email": record["Email"],
                "phone": record["Phone"],
                "isOwned": record["IsOwned"],
                "selected": False
            })

    ctx_json = json.dumps(ctx)

    return HttpResponse(ctx_json, content_type='application/json')


def purchase(request, sobject):
    sfdc = request.session['salesforce']
    body = json.loads(request.body)
    data = {}

    if sobject == 'company':
        data['companyIds'] = body["ids"]
    else:
        data['contactIds'] = body["ids"]

    purchase_result = sfdc.post("/connect/datacloud/orders/", data)
    entity_url = purchase_result['entityUrl']

    result = sfdc.get(entity_url)
    
    records = None
    if sobject == 'company':
        records = result['companies']
    else:
        records = result['contacts']

    ctx = {'fields': []}

    for record in records:
        if sobject == 'company':
            ctx["fields"].append({
                "companyId": record["companyId"],
                "dunsNumber": record["dunsNumber"],
                "name": record["name"],
                "city": record["address"]["city"],
                "country": record["address"]["country"],
                "isOwned": record["isOwned"],
                "selected": False
            })
        else:
            ctx["fields"].append({
                "contactId": record["contactId"],
                "firstName": record["firstName"],
                "lastName": record["lastName"],
                "email": record["email"],
                "phone": record["phoneNumbers"][0]["phoneNumber"],
                "isOwned": record["isOwned"],
                "selected": False
            })

    ctx_json = json.dumps(ctx)

    return HttpResponse(ctx_json, content_type='application/json')


def get_balance(request):
    sfdc = request.session['salesforce']
    url = "/connect/datacloud/usage/005D0000001Rav0IAC"

    result = sfdc.get(url)
    balance = result["listpoolCreditsAvailable"] + result["monthlyCreditsAvailable"]

    ctx = json.dumps({"balance": balance})

    return HttpResponse(ctx, content_type='application/json')


    







