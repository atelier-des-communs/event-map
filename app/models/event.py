from flask import current_app
from datetime import  datetime
from .. import db
import pytz



def serialize(value):
    if value is None :
        return None
    if isinstance(value,datetime) :
        return value.replace(tzinfo=pytz.UTC).isoformat()
    else :
        return value

class RemoteCountIP(db.Model):
    __tablename__ = 'count_ip'
    id = db.Column(db.Integer, primary_key=True)
    ip = db.Column(db.String(64), unique=True)

class Event(db.Model):
    __tablename__ = 'event'
    
    creator = db.Column(db.DATETIME)
    create_time = db.Column(db.String(64))
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(64))
    description = db.Column(db.Text())
    
    fb_id = db.Column(db.String(64))
    fb_maybe_count = db.Column(db.Integer, default=0)
    fb_attending_count = db.Column(db.Integer, default=0)
    attending_count = db.Column(db.Integer, default=0)

    loc_id = db.Column(db.String(128))
    loc_name = db.Column(db.String(128))
    loc_city = db.Column(db.String(128))
    loc_latitude = db.Column(db.Float())
    loc_longitude = db.Column(db.Float()) 
    loc_zip= db.Column(db.String(10))
    
    start_datetime = db.Column(db.DATETIME)
    end_datetime = db.Column(db.DATETIME)
    
    def __repr__(self):
        return "<Event '%s:%s'>" % (self.id, self.name)
    
    def as_dict(self):
        return {c.name: serialize(getattr(self, c.name)) for c in self.__table__.columns}

