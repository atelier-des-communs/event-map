from flask import url_for
from datetime import datetime, timezone
from pytz import timezone
import pytz

TZ = timezone("Europe/Paris")

def register_template_utils(app):
    """Register Jinja 2 helpers (called from __init__.py)."""

    @app.template_test()
    def equalto(value, other):
        return value == other

    @app.template_filter('localtime')
    def localtime(val):
        if val == None :
            return None
        return val.replace(tzinfo=pytz.UTC).astimezone(TZ).strftime("%H:%M") 
    
    @app.template_filter('localdate')
    def localdate(val):
        if val == None :
            return None
        return val.replace(tzinfo=pytz.UTC).astimezone(TZ).strftime("%d %b") 

    @app.template_global()
    def is_hidden_field(field):
        from wtforms.fields import HiddenField
        return isinstance(field, HiddenField)

    app.add_template_global(index_for_role)


def index_for_role(role):
    return url_for(role.index)
