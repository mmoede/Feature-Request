// features_viewmodel.js

function FeaturesViewModel() {
	var self = this;
	self.featuresURI = 'http://localhost:5000/requests/api/v1.0/features';
	self.username = "michael";
	self.password = "python";
	self.features = ko.observableArray();
	
	self.ajax = function(uri, method, data) {
		console.log(uri);
		console.log(method);
		console.log(data);
		var request = {
			url: uri,
			type: method,
			contentType: "application/json",
			accepts: "application/json",
			cache: false,
			dataType: 'json',
			data: JSON.stringify(data),
			beforeSend: function (xhr) {
				xhr.setRequestHeader("Authorization",
					"Basic " + btoa(self.username + ":" + self.password));
			},
			error: function(jqXHR) {
				console.log("ajax error " + jqXHR.status);
				if (jqXHR.status == 400) {
					alert(jqXHR.responseText);
				}
			}
		};
		return $.ajax(request);
	}
	
	self.removeTime = function(targetDateTime) {
		var timeIndex = targetDateTime.indexOf(':') - 2;
		var targetDate = targetDateTime.substring(0, timeIndex);
		return targetDate;
	}
	
	self.updateFeature = function(feature, newFeature) {
		var match = ko.utils.arrayFirst(self.features(), function(featureItem) {
			return featureItem.client() === newFeature.client && featureItem.client_priority() === newFeature.client_priority; 
		});
		if (match) {
			self.refreshFeatures();
		}
		else {
			var targetDate = self.removeTime(newFeature.target_date);
			var i = self.features.indexOf(feature);
			self.features()[i].uri(newFeature.uri);
			self.features()[i].title(newFeature.title);
			self.features()[i].description(newFeature.description);
			self.features()[i].client(newFeature.client);
			self.features()[i].client_priority(newFeature.client_priority);
			self.features()[i].target_date(targetDate);
			self.features()[i].product_area(newFeature.product_area);
		}
	}
	
	self.beginAdd = function() {
		clientsViewModel.setClients();
		$('#add').modal('show');
	}
	
	self.beginAddClient = function() {
		$('#addClient').modal('show');
	}
	
	self.add = function(feature) {
		self.ajax(self.featuresURI, 'POST', feature).done(function(data) {
			var targetDate = self.removeTime(data.feature.target_date);
			self.features.push({
				uri: ko.observable(data.feature.uri),
				title: ko.observable(data.feature.title),
				description: ko.observable(data.feature.description),
				client: ko.observable(data.feature.client),
				client_priority: ko.observable(data.feature.client_priority),
				target_date: ko.observable(targetDate),
				product_area: ko.observable(data.feature.product_area)
			});
			var match = ko.utils.arrayFirst(self.features(), function(featureItem) {
				return featureItem.client() === data.feature.client && featureItem.client_priority() === data.feature.client_priority; 
			});
			if (match) {
				self.refreshFeatures();
			}
		});
	}
	self.beginEdit = function(feature) {
		editFeatureViewModel.setFeature(feature);
		$('#edit').modal('show');
	}
	self.edit = function(feature, data) {
		self.ajax(feature.uri(), 'PUT', data).done(function(res) {
			self.updateFeature(feature, res.feature);
		});
	}
	self.remove = function(feature) {
		self.ajax(feature.uri(), 'DELETE').done(function() {
			self.features.remove(feature);
		});
	}
	
	self.refreshFeatures = function() {
		self.ajax(self.featuresURI, 'GET').done(function(data) {
			for (var i = 0; i < data.features.length; i++) {
				var targetDate = self.removeTime(data.features[i].target_date);
				self.features()[i].uri(data.features[i].uri);
				self.features()[i].title(data.features[i].title);
				self.features()[i].description(data.features[i].description);
				self.features()[i].client(data.features[i].client);
				self.features()[i].client_priority(data.features[i].client_priority);
				self.features()[i].target_date(targetDate);
				self.features()[i].product_area(data.features[i].product_area);
			}
			console.log(data.features);
		});
	}

	self.ajax(self.featuresURI, 'GET').done(function(data) {
		for (var i = 0; i < data.features.length; i++) {
			var targetDate = self.removeTime(data.features[i].target_date);
			self.features.push({
				uri: ko.observable(data.features[i].uri),
				title: ko.observable(data.features[i].title),
				description: ko.observable(data.features[i].description),
				client: ko.observable(data.features[i].client),
				client_priority: ko.observable(data.features[i].client_priority),
				target_date: ko.observable(targetDate),
				product_area: ko.observable(data.features[i].product_area)
			});
		}
		console.log(data.features);
	});

	
}

$('.datepicker').datepicker({
	startDate: '+1d'
});

ko.bindingHandlers.datepicker = {
    init: function(element, valueAccessor, allBindingsAccessor) {
        
        var options = allBindingsAccessor().datepickerOptions || {};
        $(element).datepicker(options);

        ko.utils.registerEventHandler(element, "changeDate", function(event) {
            var value = valueAccessor();
            if (ko.isObservable(value)) {
                value(event.date);
            }                
        });
    },
    update: function(element, valueAccessor)   {
        var widget = $(element).data("datepicker");
        if (widget) {
            widget.date = ko.utils.unwrapObservable(valueAccessor());
            widget.setValue();            
        }
    }
};

$('#add').on('hidden.bs.modal', function (e) {
	$(this)
	.find("input")
	.val('')
	.end()
});

$('#addClient').on('hidden.bs.modal', function (e) {
	$(this)
	.find("input")
	.val('')
	.end()
});

ko.bindingHandlers.stopBindings = {
    init: function() {
        return { 'controlsDescendantBindings': true };
    }        
};

function FormatDate(targetDate) {
	var month = targetDate.substring(0, 2);
	var day = targetDate.substring(3, 5);
	var year = targetDate.substring(6);
	var formatDate = year + "-" + month + "-" + day;
	return formatDate;
}

function AddFeatureViewModel() {
	var self = this;
	self.title = ko.observable();
	self.description = ko.observable();
	self.client = ko.observable();
	self.client_priority = ko.observable();
	self.target_date = ko.observable();
	self.product_area = ko.observable();
	
	self.addFeature = function() {
		$('#add').modal('hide');
		console.log("going to getClient?");
		var clientName = clientsViewModel.getClient();
		console.log("back from getclient");
		console.log(self.title());
		console.log(self.description());
		console.log(self.client());
		console.log(self.client_priority());
		console.log(targetDate);
		console.log(self.product_area());
		var targetDate = FormatDate(self.target_date());
		featuresViewModel.add({
			title: self.title(),
			description: self.description(),
			client: clientName,
			client_priority: self.client_priority(),
			target_date: targetDate,
			product_area: self.product_area()
		});
		self.title("");
		self.description("");
		self.client("");
		self.client_priority("");
		self.target_date("");
		self.product_area("");
	}
}

function EditFeatureViewModel() {
	var self = this;
	self.title = ko.observable();
	self.description = ko.observable();
	self.client = ko.observable();
	self.client_priority = ko.observable();
	self.target_date = ko.observable();
	self.product_area = ko.observable();
	
	self.setFeature = function(feature) {
		self.feature = feature;
		var targetDate = feature.target_date();
		console.log(targetDate);
		var dayIndex = targetDate.indexOf(",") + 2;
		var monthIndex = dayIndex + 3;
		var yearIndex = targetDate.length - 5;
		console.log(yearIndex);
		var day = targetDate.substr(dayIndex, 2);
		var month = targetDate.substr(monthIndex, 3);
		var year = targetDate.substr(yearIndex, 4);
		switch(month){
			case "Jan":
				var monthNumString = "01";
				break;
			case "Feb":
				var monthNumString = "02";
				break;
			case "Mar":
				var monthNumString = "03";
				break;
			case "Apr":
				var monthNumString = "04";
				break;
			case "May":
				var monthNumString = "05";
				break;
			case "Jun":
				var monthNumString = "06";
				break;
			case "Jul":
				var monthNumString = "07";
				break;
			case "Aug":
				var monthNumString = "08";
				break;
			case "Sep":
				var monthNumString = "09";
				break;
			case "Oct":
				var monthNumString = "10";
				break;
			case "Nov":
				var monthNumString = "11";
				break;
			case "Dec":
				var monthNumString = "12";
				break;
		}
		var dateString = monthNumString + "-" + day + "-" + year;
		self.title(feature.title());
		self.description(feature.description());
		self.client(feature.client());
		self.client_priority(feature.client_priority());
		self.target_date(dateString);
		self.product_area(feature.product_area());
		$('edit').modal('show');
	}
	self.editFeature = function() {
		$('#edit').modal('hide');
		var targetDate = FormatDate(self.target_date());
		featuresViewModel.edit(self.feature, {
			title: self.title(),
			description: self.description(),
			client: self.client(),
			client_priority: self.client_priority(),
			target_date: targetDate,
			product_area: self.product_area()
		});
	}
}

function ClientsViewModel() {
	var self = this;
	self.clientsURI = 'http://localhost:5000/requests/api/v1.0/clients';
	self.username = "michael";
	self.password = "python";
	self.clients = ko.observableArray();
	self.name = ko.observable();
	
	self.ajax = function(uri, method, data) {
		console.log(uri);
		console.log(method);
		console.log(data);
		var request = {
			url: uri,
			type: method,
			contentType: "application/json",
			accepts: "application/json",
			cache: false,
			dataType: 'json',
			data: JSON.stringify(data),
			beforeSend: function (xhr) {
				xhr.setRequestHeader("Authorization",
					"Basic " + btoa(self.username + ":" + self.password));
			},
			success: function() {
				if (method == "POST") {
					alert("Client has been added");
				}
			},
			error: function(jqXHR) {
				console.log("ajax error " + jqXHR.status);
				if (jqXHR.status == 400) {
					alert(jqXHR.responseText);
				}
			}
		};
		return $.ajax(request);
	}
	
	self.setClients = function() {
		self.ajax(self.clientsURI, 'GET').done(function(data) {
			console.log(data);
			console.log(data.clients.length);
			for (var i = 0; i < data.clients.length; i++) {
				console.log(data.clients[i].uri);
				console.log(data.clients[i].name);
				self.clients.push({
					uri: ko.observable(data.clients[i].uri),
					name: ko.observable(data.clients[i].name)
				});
			}
			console.log(data.clients);
		});
	}
	
	self.getClient = function() {
		return self.name();
	}
	
	self.add = function(client) {
		self.ajax(self.clientsURI, 'POST', client).done(function(data) {
			self.clients.push({
				uri: ko.observable(data.client.uri),
				name: ko.observable(data.client.name)
			});
		});
	}
	
}

function AddClientViewModel() {
	var self = this;
	self.name = ko.observable();
	
	self.addClient = function() {
		$('#addClient').modal('hide');
		console.log(self.name());
		clientsViewModel.add({
			name: self.name()
		});
		self.name("");
	}
}

var featuresViewModel = new FeaturesViewModel();
var addFeatureViewModel = new AddFeatureViewModel();
var editFeatureViewModel = new EditFeatureViewModel();
var clientsViewModel = new ClientsViewModel();
var addClientsViewModel = new AddClientViewModel();
ko.applyBindings(featuresViewModel, $('#main')[0]);
ko.applyBindings(addFeatureViewModel, $('#add')[0]);
ko.applyBindings(editFeatureViewModel, $('#edit')[0]);
ko.applyBindings(clientsViewModel, $('#clientSelect')[0]);
ko.applyBindings(addClientsViewModel, $('#addClient')[0]);