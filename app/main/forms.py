

from flask_wtf import Form, RecaptchaField
from wtforms import TextField
from wtforms.fields.core import StringField, IntegerField, FloatField
from wtforms.validators import InputRequired, Length
from wtforms.fields.html5 import DateTimeField

class EventForm(Form):
    recaptcha = RecaptchaField()

    id = StringField('id')
    
    name = StringField('id', validators=[InputRequired(),  Length(1, 300)])
    description = TextField('Description')
    
    fb_id = StringField('Facebook event id')
    fb_maybe_count = IntegerField('Facebook maybe count')
    fb_attending_count = IntegerField('Facebook attending count')
    
    # attending_count = db.Column(db.Integer, default=0)

    loc_id = StringField('Location id', validators=[InputRequired()])
    loc_name = StringField('Location name', validators=[InputRequired()])
    loc_city = StringField('City')
    loc_latitude = FloatField('Latitude', validators=[InputRequired()])
    loc_longitude = FloatField('Longitude', validators=[InputRequired()])
    loc_zip = StringField('Zip code')
    
    start_time = DateTimeField('Start time', validators=[InputRequired()])
    # end_time = db.Column(db.DATETIME)
    