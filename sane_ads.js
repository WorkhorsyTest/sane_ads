// Copyright (c) 2015 Matthew Brennan Jones <matthew.brennan.jones@gmail.com>
// This software is licensed under a MIT style license

/*
. Ads are clearly labeled as Advertisements, with a standard fixed width and height
. Ads are run in a sandboxed iframe
. Ads cannot run javascript, auto play videos, submit forms, or use embed/applet/object
. Ads can use html and css only
. Make sure all ads are a standard width and height
. The memory size of all the elements in the ad are displayed in the top
. Ads are loaded after the page content
. Ads that use too much memory are removed
*/

function appendAd(parent_element, memory_max, ad_url, width, height) {
	// Wraps the ad in a black border
	var fieldset = document.createElement('fieldset');
	fieldset.style.display = 'inline';
	fieldset.style.padding = '2px';
	fieldset.style.margin = '0';
	fieldset.style.backgroundColor = 'white';
	parent_element.appendChild(fieldset);

	// Says "Advertisement" and the memory usage at the top of the ad
	var legend = document.createElement('legend');
	legend.style.backgroundColor = 'white';
	legend.innerHTML = 'Advertisement';
	fieldset.appendChild(legend);

	// The iframe that holds the ad
	var iframe = document.createElement('iframe');
	iframe.width = width;
	iframe.height = height;
	iframe.style.border = '0';
	// Allow links to change this page, and allow scripts on this page to look in the ad iframe
	iframe.setAttribute('sandbox', 'allow-top-navigation allow-same-origin');
	iframe.src = ad_url;
	fieldset.appendChild(iframe);

	// Wait for the ad to be completely loaded, then gets its memory size
	// FIXME: Change this to use the on ready state change event, instead of polling
	var setup_interval = setInterval(function() {
		if (iframe.contentDocument.readyState === 'complete') {
			clearInterval(setup_interval);
			getAdMemorySize(memory_max, iframe, legend);
		}
	}, 333);
}

function toPrettyMemorySize(byte_size) {
	if (byte_size > 1024000000) {
		return (byte_size / 1024000000).toFixed(2) + ' GB';
	} else if (byte_size > 1024000) {
		return (byte_size / 1024000).toFixed(2) + ' MB';
	} else if (byte_size > 1024) {
		return (byte_size / 1024).toFixed(2) + ' KB';
	} else {
		return (byte_size / 1).toFixed(2) + ' B';
	}
}

// NOTE: CORS stops us from accessing the Content-Length header field. But
// we can access it by manually parsing the raw headers
function getResponseHeaderContentLength(xhr) {
	// Get the headers as a raw string
	var raw = xhr.getAllResponseHeaders().toLowerCase();

	// If there is no Content-Length, just return 0
	if (raw.indexOf('content-length: ') === -1) {
		return 0;
	}

	// Get the value
	var content_length = 0;
	content_length = raw.split('content-length: ')[1];
	content_length = content_length.split('\r\n')[0];
	content_length = parseInt(content_length);
	return content_length;
}

function isDataURI(src) {
	return src && src.indexOf('data:') === 0;
}

function blobToDataURI(blob, cb) {
	var a = new FileReader();
	a.onload = function(e) {
		cb(e.target.result);
	}
	a.readAsDataURL(blob);
}

function httpGetBlob(request, success_cb, fail_cb) {
	var xhr = new XMLHttpRequest();
	xhr.onreadystatechange = function() {
		if (xhr.readyState === 4) {
			if (xhr.status === 200) {
				var response_bytes = xhr.response;
				var total_len = getResponseHeaderContentLength(xhr);
				success_cb(request, response_bytes, total_len);
			} else {
				if (fail_cb) fail_cb(xhr.status);
			}
		} else if (xhr.readyState === 0) {
			if (fail_cb) fail_cb(0);
		}
	};
	xhr.onerror = function() {
		if (fail_cb) fail_cb(0);
	};
	xhr.open('GET', request, true);
	xhr.timeout = 3000;
	xhr.responseType = 'blob';
	xhr.send(null);
}

function enforceMemoryUsage(memory_max, iframe, legend, memory_size) {
	var pretty_total = toPrettyMemorySize(memory_size);
	var pretty_max = toPrettyMemorySize(memory_max);

	// If the ad uses too much memory, remove it
	if (memory_size > memory_max) {
		var doc = iframe.contentDocument;
		doc.open();
		doc.writeln("<!doctype html><html><body>Removed for excess memory usage:<br>" + pretty_total + " of " + pretty_max + "</body></html>");
		doc.close();
		legend.innerHTML = 'Advertisement';
	// Otherwise show the memory usage
	} else {
		legend.innerHTML = 'Advertisement<br>(' + pretty_total + ')';
	}
}

// FIXME: Update to include the size of any CSS, HTML, and Video files
function getAdMemorySize(memory_max, iframe, legend) {
	var doc = iframe.contentDocument;
	var memory_size = 0;
	enforceMemoryUsage(memory_max, iframe, legend, memory_size);

	var imgs = doc.getElementsByTagName('img');
	for (var i=0; i<imgs.length; ++i) {
		var img = imgs[i];
		if (img.src && img.complete) {
			if (isDataURI(img.src)) {
				console.log('img size: ' + toPrettyMemorySize(img.src.length));
				memory_size += img.src.length;
				enforceMemoryUsage(memory_max, iframe, legend, memory_size);
			} else {			
				httpGetBlob(img.src, function(src, data, total_size) {
					console.log('img size: ' + toPrettyMemorySize(total_size));
					memory_size += total_size;
					enforceMemoryUsage(memory_max, iframe, legend, memory_size);
				});
			}
		}
	}
}

