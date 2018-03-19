from flask import jsonify
from . import rest
from facebook import GraphAPI
from flask import current_app as app
from ..models import Event

def update_event(event, fb_event):
    """ Update Event instance with facebook """
    
    event.fb_id = fb_event['id']
    event.name = fb_event['name']
    event.description = fb_event['description']
    event.fb_maybe_count = fb_event['interested_count']
    event.fb_attending_count = fb_event['attending_count']
    
    if 'place' in fb_event :
        place = fb_event['place']
        event.loc_name= place['name']
        if 'location' in place :
            location = place['location'] 
            event.loc_id = "fb:%s" % place['id']
            event.loc_city = location['city']
            event.loc_latitude = location['latitude']
            event.loc_longitude = location['longitude']
            event.loc_zip = location['zip']
    
        
@rest.route('/fb-event/<fb_id>')
def fb_event(fb_id):
    
    event = Event()
     
    fb = GraphAPI(access_token=app.config['FB_TOKEN'], version="2.12")
    fb_event = fb.get_object(id=fb_id, fields=",".join([
        "place",
        "description",
        "name",
        "interested_count",
        "attending_count",
        "start_time",
        "end_time",
        "id"]))
    
    print(fb_event)

    update_event(event, fb_event)

    return jsonify(event.as_dict())
    
