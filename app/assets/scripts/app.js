// Semantic UI breakpoints
var mobileBreakpoint = '768px';
var tabletBreakpoint = '992px';
var smallMonitorBreakpoint = '1200px';


function pad(n, width, z) {
	z = z || '0';
	n = n + '';
	return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
}

function extract(address, properties, first) {
	var props = $.grep(properties, function(prop) {
		return address.hasOwnProperty(prop);
	})
	var values = $.map(props, function(prop) {
		return address[prop];
	})
	if (first && values.length >= 1) {
		values = [values[0]];
	}
	return values.join(", ");
}

function create_map(element_id, position, zoom) {
	  var map = L.map(element_id);
	  var osmUrl='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
	  var osmAttrib='Map data © <a href="http://openstreetmap.org">OpenStreetMap</a> contributors';
	  var osm = new L.TileLayer(osmUrl, {attribution: osmAttrib});
	  map.addLayer(osm);
	  map.setView(position, zoom);
	  return map;
}

$.fn.form.settings.rules.recaptchaValidation = function() {
    return grecaptcha.getResponse().length !== 0;
}

$(document).ready(function () {

	$.fn.api.settings.api = {
		"nominatim search" : 'https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&countrycodes=fr&q={query}',
		"nominatim reverse" : 'https://nominatim.openstreetmap.org/reverse?format=json&addressdetails=1&lat={lat}&lon={lon}',
		"search fb" : '/rest/fb-event/{event_id}',
		"increment counter" : '/rest/add-count/{event_id}'
	}
	
	
  // Enable dismissable flash messages
  $('.message .close').on('click', function () {
    $(this).closest('.message').transition('fade');
  });

  // Enable mobile navigation
  $('#open-nav').on('click', function () {
    $('.mobile.only .vertical.menu').transition('slide down');
  });

  // Enable sortable tables
  $('table.ui.sortable').tablesort();

  // Enable dropdowns
  $('.dropdown').dropdown();
  $('select').dropdown();
  function icontains(elem, text) {
    return (elem.textContent || elem.innerText || $(elem).text() || "")
      .toLowerCase().indexOf((text || "").toLowerCase()) > -1;
  }
  

  
  var form = $(".eh-event-form").form({
    fields: {
      name : {
          rules: [{type : 'empty', prompt : "Le nom est requis"}]
      },
      start_date : {
          rules: [{type : 'empty', prompt : "La date est requise"}]
      },
      start_time : {
          rules: [{type : 'empty', prompt : "L'heure est requise"}]
      },
      loc_latitude : {
          rules: [{type : 'empty', prompt : "Une position précise est requise"}]
      },
      captcha : { 
    	  identifier: 'recaptcha',
    	  rules: [{type: 'recaptchaValidation', prompt : 'Cochez le captcha'}]
      }
    }
  });
  
  // Fill time dropdown
  for(hour=7; hour <= 23; hour++) {
	  for(minute=0; minute <= 45; minute += 15 ) {
		var time =  pad(hour, 2) + ':' + pad(minute, 2);
		$(".time.menu").append('<div class="item" data-value="TIME">TIME</div>'.replace(/TIME/g, time)) 
	  }
  } 
  $(".ui.dropdown.time").dropdown();
  
  function fillFromJSON(res) {
	  $("[name]", form).each(function(input) {
		  var name = $(this).attr("name");
		  if (res.hasOwnProperty(name)) {
			  $(this).val(res[name]);
		  }
	  });
	  
	  // Set link
	  if (res.fb_id) {
		  var fb_link = "http://www.facebook.com/events/" + res.fb_id;
		  $(".fb-link").attr("href", fb_link);
		  $(".fb-link").text(fb_link);
	  }
	  // Split date time
	  var local_start_datetime = moment(res.start_datetime).local();
	  var local_time = local_start_datetime.format("HH:mm");
	  var local_date = local_start_datetime.format("YYYY-MM-DD");
	  $("input[name=start_date]").val(local_date);
	  
	  $("input[name=start_time]").val(local_time);
	  $(".eh-start-time-text").text(local_time);
	  
	  // Set location
	  $("input[name=loc_title]").val(res.loc_name);
	  
	  if (res.loc_latitude) {
		  updateMarkerLocation(
				  res.loc_latitude,
				  res.loc_longitude, 
				  true);
	  } else {
		  // No precise location yet
		  
	  }
	  
	  // Disable all fields
	  // $(".fb-disabled", form).addClass("disabled");
	  
	  // Disable location if set in facebook
	  //$("input[name=loc_id]").parents(".field").toggleClass(
		//	  "disabled", 
		//	  res.loc_id);
	  
  }
  
  // Fb Link handling
  $("input[name=fb_link]").on("input", function() {
	  var self = $(this);
	  var parent_field = self.parents(".field");
	  var parent_input = self.parents(".input");
	  
	  var link = self.val();
	  var res = link.match(/.*facebook\.com\/events\/(\d+).*/)
	  
	  if (res == null ) {
		  parent_field.addClass("error");
		  self.attr("title", "Doit être au format : *facebook.com\events/<id>/*");
		  return;
	  }
	  
	  parent_field.removeClass("error");
	  
	  var event_id = res[1];
	  
	  // Set loading
	  parent_input.addClass("loading");
	  
	  self.api({
		  action: 'search fb', 
		  on : 'now',
		  urlData : {event_id:event_id},
	      onResponse: function(res) {
	    	  parent_input.removeClass("loading");
	    	  fillFromJSON(res);
	  	  }});  
  });
  
  var map = create_map("eh-location-picker-map",  [46.316584, 2.592773], 12);
  var main_map = create_map("main-map", [46.316584, 2.592773], 6);
  
  function resetModal() {
	  if (marker != null) {
		  map.removeLayer(marker);
		  marker= null;
	  }
	  $(form)[0].reset();
  }
  
  function viewModal(event) {
	  resetModal();
	  fillFromJSON(event);
	  showModal(true);  
  }
  
  var nbParticipants = 0;
  $.each(events, function(index, event) {
	  marker = new L.marker(new L.LatLng(
			  event.loc_latitude, 
			  event.loc_longitude));
	  main_map.addLayer(marker);
	  marker.on("click", function() {
		  viewModal(event);
	  });
	  nbParticipants += 
		  event.fb_attending_count + 
		  event.fb_maybe_count + 
		  event.attending_count;
  })
  
  $(".eh-main-count").text(nbParticipants);
  
  var marker = null;

  $(".view-button").click(function() {
	  var eventId = $(this).attr("data-event-id");
	  viewModal(events[eventId]);
  })
  
  $(".total-count-button").click(function() {
	 alert("Pour vous compter, cliquez une des manifestations de la liste en dessous"); 
  });
  
   $(".count-button").click(function() {
	  var eventId = $(this).attr("data-event-id");
	  var csrf_token = $("input[name=csrf_token]").val();
	  
	  var label = $(".label", this);
	  var count = parseInt(label.text());
	  
	  $(this).api({
		  on : "now",
		  action : "increment counter",
		  method : 'POST',
		  urlData: {event_id: eventId},
		  data : {csrf_token: csrf_token},
		  onSuccess: function(res) {
			  console.log("incremented");
			  count +=1;
			  label.text(count);
			  return res;
		  },
		  successTest: function(response) {
		      return response.success || false;
		  },
		  onFailure: function(response) {
			  alert(response.message);
		  },
		  
	  });	  
	  });
 
  
  function updateMarkerLocation(lat, lng, fromText) {
	  if (!marker) {
		  var viewMode = $(".modal").hasClass("view-mode");
		  marker = new L.marker(new L.LatLng(lat, lng), {draggable: !viewMode});
		  marker.on('dragend', function(event){
			    var marker = event.target;
			    var position = marker.getLatLng();
			    updateTextFromLocation(position.lat, position.lng);
		  });
		  map.addLayer(marker);
	  }
	  map.panTo(new L.LatLng(lat, lng));
	  marker.setLatLng(new L.LatLng(lat, lng), {draggable:'true'});
	  if (!fromText) {
		  updateTextFromLocation(lat, lng);
	  }
  }
  
  function updateTextFromLocation(lat, lng) {
	  $(".eh-place-text").addClass("loading");
	  $("body").api({
		  action: 'nominatim reverse', 
		  on : 'now',
		  urlData : {
			  lat: lat,
			  lon : lng
		  },
	     onResponse: function(res) {
	    	 var res = extractRes(res);
	    	 setLocationInputVals(res);
	    	 $(".eh-place-text").removeClass("loading");
	  	 }});
  }
  
  // Extract result from single nominatim response
  function extractRes(item) {
	   var city = extract(item.address, ['village', 'city', 'town'], true);
	   var name = extract(item.address, ['attraction', 'house_number', 'road', 'street']);
	   var title = ((name) ? name + ", " : "") + city;
	   if (!name) name = city;
	   return {
		   title: title,
		   latitude : parseFloat(item.lat),
		   longitude : parseFloat(item.lon),
		   city : city,
		   name: name,
		   zip: item.address.postcode,
		   id : "osm:" + item.place_id
	   }
  }
  
  function setLocationInputVals(res) {
	  $.each(['id', 'name', 'zip', 'latitude', 'longitude', 'city', 'title'], function(idx, key) {
		  console.log(key, res[key]);
		  $("input[name=loc_KEY]".replace("KEY", key)).val(res[key]);  
	  });
  }

  map.on('click', function(e) {
	  if (!$(".modal").hasClass("view-mode")) {  
		  updateMarkerLocation(e.latlng.lat, e.latlng.lng);
	  }
  });
  
  $('.ui.search.location').search({
	   apiSettings : {
		   // translate Nominatim API response to work with search
		   onResponse: function(res) {
			   res =  $.map(res, extractRes);
			   res = $.grep(res, function(item) {return item.title})
			   return {results : res};
		   },
		   searchDelay : 700,
		   minCharacters : 5,
		   action: 'nominatim search'
	   },
	 onSelect : function(res) {
	   updateMarkerLocation(res.latitude, res.longitude, true);
	   setLocationInputVals(res);
	   return true;
	 }
  });
 
  function prepareForm() {
	  var start_date = $("input[name=start_date]").val();
	  var start_time = $("input[name=start_time]").val();
	  var datetime = moment(start_date + 'T' + start_time, moment.HTML5_FMT.DATETIME_LOCAL);
	  $("input[name=start_datetime]").val(datetime.utc().format())
  }

  var modal = $('.eh-add-event.modal').modal({
	  onVisible : function() {
	  	map.invalidateSize();
	    $(".leaflet-container").css('cursor','crosshair');
	  },
	  onApprove : function() {
		  prepareForm();
		  if (form.form("validate form")) {
			   form.form("submit");
		  }
		  return false;
	  }
  });
  
  function showModal(view) {
	  $(".eh-add-event.modal .view-only").toggleClass("hidden", !view);
	  $(".eh-add-event.modal .edit-only").toggleClass("hidden", view);
	  $('.eh-add-event.modal').toggleClass('view-mode', view);
	  $('.eh-add-event.modal').modal('show');
  }
  
  $('.eh-add-event.button').click(function() {
	  resetModal();
	  showModal(false);
  });
  
  
  $.expr[':'].icontains = $.expr.createPseudo ?
    $.expr.createPseudo(function (text) {
      return function (elem) {
        return icontains(elem, text);
      };
    }) :
      function (elem, i, match) {
        return icontains(elem, match[3]);
      };
});


// Add a case-insensitive version of jQuery :contains pseduo
// Used in table filtering
(function ($) {
})(jQuery);


// mobile dropdown menu state change 
// This code is used for modeling the state of the mobile dropdown menu. 
// When a mobile menu item with a dropdown is touched, the changeMenu function
// is called. It gets all the children of the dropdown and stores them as the
// children variable. During this time, the state of the dropdown menu is saved
// into the currentState array for later. A 'back' item that has an onclick attr
// calling the back() function is appended to the children variable and the
// html of the mobile dropdown is set to the children variable. 
// If the back button is clicked, we get the parent menu of the submenu by popping
// the currentState variable.

var currentState = [];

function changeMenu(e) {
  var children = $($(e).children()[1]).html();
  children += '<a class="item" onClick="back()">Back</a><i class="back icon"></i>';
  currentState.push($('.mobile.only .vertical.menu').html());
  $('.mobile.only .vertical.menu').html(children);
}

function back() {
  $('.mobile.only .vertical.menu').html(currentState.pop());
}
