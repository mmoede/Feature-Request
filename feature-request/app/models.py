from app import db

class Client(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(64), index=True, unique=True)
    features = db.relationship('Feature', backref='client',lazy='dynamic')

    def __repr__(self):
        return '<Client %r>' % (self.name)

class Feature(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(64), index=True, unique=True)
    description = db.Column(db.String(500), index=True, unique=True)
    client_id = db.Column(db.Integer, db.ForeignKey('client.id'))
    client_priority = db.Column(db.Integer, index=True, unique=False)
    target_date = db.Column(db.DateTime, index=True, unique=False)
    product_area = db.Column(db.String(24), index = True, unique=False)

    def __repr__(self):
        return '<Feature %r>' % (self.title)

