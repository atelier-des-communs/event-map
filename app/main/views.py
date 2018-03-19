from flask import abort, flash, redirect, render_template, request, url_for
from . import main
from .. import db
from ..models import EditableHTML, Event
from .forms import EventForm
from dateutil.parser import parse

DATE="2018-03-22"

@main.route('/')
def index():
    form = EventForm()
    return render_template('main/index.html', form=form)

@main.route('/', methods=['POST'])
def post_event():
    form = EventForm()
    form.validate()
    event = Event(
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
        start_datetime = parse("%sT%s" % (DATE, form.start_time.data)))
    
    db.session.add(event)
    db.session.commit()
    
    flash("L'événement a bien été ajouté")

    return index()


@main.route('/about')
def about():
    editable_html_obj = EditableHTML.get_editable_html('about')
    return render_template(
        'main/about.html', editable_html_obj=editable_html_obj)
    
