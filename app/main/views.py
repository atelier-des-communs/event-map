from flask import abort, flash, redirect, render_template, request, url_for
from . import main
from .. import db
from ..models import EditableHTML, Event
from .forms import EventForm
from dateutil.parser import parse
from datetime import  datetime

def flash_errors(form):
    for field, errors in form.errors.items():
        for error in errors:
            msg = u"Erreur dans le champ %s - %s" % (getattr(form, field).label.text, error)
            flash(msg, "error")
            print("Error : %s" % msg)
           

@main.route('/', methods=['GET'])
def index():
    return render_template('main/index.html')

@main.route('/22-mars', methods=['GET'])
def calendar():
    form = EventForm()
    
    events = db.session.query(Event).all()
    
    events = sorted(events, key = lambda x : x.loc_city or "_")
    
    json_events = {}
    for event in events :
        json_events[event.id] = event.as_dict()

    return render_template('main/calendar.html', form=form, json_events=json_events, events=events)

@main.route('/22-mars', methods=['POST'])
def post_event():

    form = EventForm()
    if form.validate_on_submit() :
        
        # Check if fb id not already there
        if form.fb_id.data :
            count = db.session.query(Event).filter(Event.fb_id == form.fb_id.data).count()
            if count >= 1 :
                flash("Cet évènement Facebook existait déjà", "error")   
                return redirect(url_for('main.calendar'))
            
        event = Event(
            creator = request.remote_addr,
            create_time = datetime.now(),
            name = form.name.data, 
            description = form.description.data,   
            fb_id = form.fb_id.data,
            fb_maybe_count = form.fb_maybe_count.data,
            fb_attending_count = form.fb_attending_count.data,
            loc_id = form.loc_id.data, 
            loc_name = form.loc_name.data,
            loc_city = form.loc_city.data,
            loc_latitude = form.loc_latitude.data, 
            loc_longitude = form.loc_longitude.data, 
            loc_zip = form.loc_zip.data, 
            start_datetime = form.start_datetime.data)
    
        db.session.add(event)
        db.session.commit()
        
        flash("L'événement a bien été ajouté", "success") 
    else :
        print("KO")
        flash_errors(form)
  
    return redirect(url_for('main.calendar'))


@main.route('/about')
def about():
    editable_html_obj = EditableHTML.get_editable_html('about')
    return render_template(
        'main/about.html', editable_html_obj=editable_html_obj)
    
