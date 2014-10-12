from django.conf.urls import patterns, url
from views import index_view, search, purchase, get_balance


urlpatterns = patterns('',
    url(r'^$', index_view, name='index'),
    url(r'^search/(?P<sobject>[\w\-]+)/(?P<name>[\w\- ]+)$', search),
    url(r'^purchase/(?P<sobject>[\w\-]+)$', purchase),
    url(r'^getBalance$', get_balance),
)