from flask import jsonify, request
from . import rest
from facebook import GraphAPI
from flask import current_app as app
from flask import request
from ..models import Event, RemoteCountIP
from dateutil.parser import parse
from datetime import timezone, datetime
from .. import db

def update_event(event, fb_event):
    """ Update Event instance with facebook """
        
    event.fb_id = fb_event['id']
    event.name = fb_event['name']
    event.description = fb_event['description']
    event.fb_maybe_count = fb_event['interested_count']
    event.fb_attending_count = fb_event['attending_count']
    
    event.start_datetime = parse(fb_event['start_time']).astimezone(timezone.utc)
    
    if 'place' in fb_event :
        place = fb_event['place']
        event.loc_name= place.get('name')
        if 'location' in place :
            location = place['location'] 
            if place.get('id') :
                event.loc_id = "fb:%s" % place.get('id')
            event.loc_city = location.get('city')
            event.loc_latitude = location.get('latitude')
            event.loc_longitude = location.get('longitude')
            event.loc_zip = location.get('zip')
            
            
@rest.route('/add-count/<event_id>', methods=['POST'])
def count(event_id): 
    
    nb_ip = db.session.query(RemoteCountIP).filter(RemoteCountIP.ip == request.remote_addr).count()
    print("Nb IP : %s" % nb_ip)
    if nb_ip >= 1 :
        return jsonify(dict(success=False, message="Vous êtes déjà inscrit"))
    
    # Increment
    event = db.session.query(Event).filter(Event.id == event_id).first()
    event.attending_count = Event.attending_count + 1
    
    # Add one entry to list of ip adresses 
    db.session.add(RemoteCountIP(ip=request.remote_addr))
    db.session.commit()
    return jsonify(dict(success=True))
      
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
    
