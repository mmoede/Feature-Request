#!bin/python

from flask import Flask, jsonify, abort, make_response
from flask.ext.restful import Api, Resource, reqparse, fields, marshal
from flask.ext.httpauth import HTTPBasicAuth
from sqlalchemy.orm import load_only
from app import db, models
import datetime


app = Flask(__name__, static_url_path="")
api = Api(app)
auth = HTTPBasicAuth()


@auth.get_password
def get_password(username):
    if username == 'michael':
        return 'python'
    return None


@auth.error_handler
def unauthorized():

    return make_response(jsonify({'message': 'Unauthorized access'}), 403)

feature_fields = {
    'title': fields.String,
    'description': fields.String,
    'client': fields.String,
    'client_priority': fields.Integer,
    'target_date': fields.DateTime(dt_format='rfc822'),
    'product_area': fields.String,
    'uri': fields.Url('feature')
}

client_fields = {
    'id': fields.Integer,
    'name': fields.String,
    'uri': fields.Url('clients')
}

class FeatureListAPI(Resource):
    decorators = [auth.login_required]

    def __init__(self):
        self.reqparse = reqparse.RequestParser()
        self.reqparse.add_argument('title', type=str, required=True,
                                   help='No feature title provided',
                                   location='json')
        self.reqparse.add_argument('description', type=str, required=True,
                                   help='No feature description provided',
                                   location='json')
        self.reqparse.add_argument('client', type=str, required=True,
                                   help='No client provided',
                                   location='json')
        self.reqparse.add_argument('client_priority', type=int, required=True,
                                   help='No client priority provided',
                                   location='json')
        self.reqparse.add_argument('target_date', type=lambda x: datetime.datetime.strptime(x, '%Y-%m-%d'), required=True,
                                   help='Invalid target date provided',
                                   location='json')
        self.reqparse.add_argument('product_area', type=str, required=True,
                                   help='No product area provided',
                                   location='json')
        super(FeatureListAPI, self).__init__()

    def get(self):
        features = models.Feature.query.all()
        return {'features': [marshal(features, feature_fields)]}

    def post(self):
        args = self.reqparse.parse_args()
        client = models.Client.query.filter_by(name=args['client']).first()

        self.modify_priorities(args['client_priority'],client.id)
        feature = models.Feature(title=args['title'], description=args['description'], client=client,
                                 client_priority=args['client_priority'], target_date=args['target_date'],
                                 product_area=args['product_area'])
        db.session.add(feature)
        db.session.commit()

        return {'feature': marshal(feature, feature_fields)}, 201

    def modify_priorities(self, priority, priority_client_id):
        client_priority = models.Feature.query.filter_by(client_id=priority_client_id).filter_by(client_priority=priority).all()
        if client_priority is None:
            return
        client_features = models.Feature.query.filter_by(client_id=priority_client_id).order_by(models.Feature.client_priority.desc()).all()
        for client_feature in client_features:
            if client_feature.client_priority < priority:
                break
            else:
                client_feature.client_priority = models.Feature.client_priority + 1
        db.session.commit()


class FeatureAPI(Resource):
    decorators = [auth.login_required]

    def __init__(self):
        self.reqparse = reqparse.RequestParser()
        self.reqparse.add_argument('title', type=str, location='json')
        self.reqparse.add_argument('description', type=str, location='json')
        self.reqparse.add_argument('client', type=str, location='json')
        self.reqparse.add_argument('client_priority', type=int, location='json')
        self.reqparse.add_argument('target_date', type=lambda x: datetime.strptime(x, '%Y-%m-%d'), location='json')
        self.reqparse.add_argument('product_area', type=str, location='json')
        super(FeatureAPI, self).__init__()

    def get(self, id):
        feature = models.Feature.query.filter_by(id=id).first()
        if feature is None:
            abort(404)
        return {'feature': marshal(feature, feature_fields)}

    def put(self, id):
        feature = models.Feature.query.filter_by(id=id).first()
        if feature is None:
            abort(404)
        args = self.reqparse.parse_args()
        for k, v in args.items():
            if v is not None:
                if k == 'title':
                    feature.title = v
                elif k == 'description':
                    feature.description = v
                elif k == 'client':
                    feature.client = models.Client.query.filter_by(name=v).first()
                elif k == 'client_priority':
                    self.modify_priorities(v, id)
                    feature.client_priority = v
                elif k == 'target_date':
                    feature.target_date = v
                elif k == 'product_area':
                    feature.product_area = v
                db.session.commit()
        return {'feature': marshal(feature, feature_fields)}

    def delete(self, id):
        feature = models.Feature.query.filter_by(id=id).first()
        if feature is None:
            abort(404)
        db.session.delete(feature)
        db.session.commit()
        return {'result': True}

    def modify_priorities(self, priority, id):
        current_priority = models.Feature.query.with_entities(models.Feature.client_priority).filter_by(id=id).scalar()
        priority_client_id = models.Feature.query.with_entities(models.Feature.client_id).filter_by(id=id).scalar()
        client_priorities = models.Feature.query.filter_by(client_id=priority_client_id).filter_by(client_priority=priority).all()
        if client_priorities is None:
            return
        if priority < current_priority:
            client_features = models.Feature.query.filter_by(client_id=priority_client_id)\
                .filter(models.Feature.client_priority >= priority, models.Feature.client_priority < current_priority)
            for client_feature in client_features:
                client_feature.client_priority = models.Feature.client_priority + 1
            db.session.commit()
        elif priority > current_priority:
            client_features = models.Feature.query.filter_by(client_id=priority_client_id) \
                .filter(models.Feature.client_priority <= priority, models.Feature.client_priority > current_priority)
            for client_feature in client_features:
                client_feature.client_priority = models.Feature.client_priority - 1
            db.session.commit()


class OrderAllAPI(Resource):
    decorators = [auth.login_required]

    def __init__(self):
        super(OrderAllAPI, self).__init__()

    def get(self, column, order):
        if column == 'client' and order == 'asc':
            features = models.Feature.query.order_by(models.Feature.client_id.asc()).all()
        elif column == 'client' and order == 'desc':
            features = models.Feature.query.order_by(models.Feature.client_id.asc()).all()
        elif column == 'priority' and order == 'asc':
            features = models.Feature.query.order_by(models.Feature.client_priority.asc()).all()
        elif column == 'priority' and order == 'desc':
            features = models.Feature.query.order_by(models.Feature.client_priority.desc()).all()
        elif column == 'target_date' and order == 'asc':
            features = models.Feature.query.order_by(models.Feature.target_date.asc()).all()
        elif column == 'target_date' and order == 'desc':
            features = models.Feature.query.order_by(models.Feature.target_date.desc()).all()
        elif column == 'product_area' and order == 'asc':
            features = models.Feature.query.order_by(models.Feature.product_area.asc()).all()
        elif column == 'product_area' and order == 'desc':
            features = models.Feature.query.order_by(models.Feature.product_area.desc()).all()
        else:
            abort(404)
        return {'features': [marshal(features, feature_fields)]}

class ClientAPI(Resource):
    decorators = [auth.login_required]

    def __init__(self):
        self.reqparse = reqparse.RequestParser()
        self.reqparse.add_argument('name', type=str, required=True,
                                   help='No name provided',
                                   location='json')
        super(ClientAPI, self).__init__()

    def get(self):
        clients = models.Client.query.all()
        return {'clients': [marshal(clients, client_fields)]}

    def post(self):
        args = self.reqparse.parse_args()
        client_id = models.Client.query.with_entities(models.Client.id).filter_by(name=args['name']).scalar()
        if client_id is not None:
            abort(400, 'Client already exists')
        client = models.Client(name=args['name'])
        db.session.add(client)
        db.session.commit()
        return {'client': marshal(client, client_fields)}, 201


api.add_resource(FeatureListAPI, '/requests/api/v1.0/features', endpoint='features')
api.add_resource(FeatureAPI, '/requests/api/v1.0/features/<int:id>', endpoint='feature')
api.add_resource(OrderAllAPI, '/requests/api/v1.0/features/order/<column>/<order>', endpoint='order_all')
api.add_resource(ClientAPI, '/requests/api/v1.0/clients', endpoint='clients')

if __name__ == '__main__':
    app.run(debug=True,host='0.0.0.0')