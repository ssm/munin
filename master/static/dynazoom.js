// Set the width of the divs after image has loaded.
function imageonload()
{
	var w = this.width + "px";
	divgraph.style.width = w;

	for (var i = 0; i < divbar.length; i++)
		divbar[i].style.width = w;
}

// Apparently called only once above.  Use values from graph instead of form.
function refreshImg() {
	var cgip = [];

	// Test for a number or the string 'none'.
	// NOTE: the value null is considered a number is not an empty
	// string.  However, this value cannot be null.
	if (!isNaN(graph.limit.lower) && graph.limit.lower != '' ||
		graph.limit.lower == "none")
		cgip.push("lower_limit=" + graph.limit.lower);
	if (!isNaN(graph.limit.upper) && graph.limit.upper != '' ||
		graph.limit.upper == "none")
		cgip.push("upper_limit=" + graph.limit.upper);

	// Graph size (x, y)
	if (graph.size.x > 0)
		cgip.push("size_x=" + graph.size.x);
	if (graph.size.y > 0)
		cgip.push("size_y=" + graph.size.y);

	// Graph step
	if (graph.step > 0)
		cgip.push("step=" + graph.step);

	// Compile the fields
	if (typeof form.field !== "undefined")
	{
		var unchecked = 0;
		var field = [];

		for (var i = 0; i < form.field.length; i++)
		{
			var box = form.field[i];

			if (box.checked)
				field.push("field=" + box.value);
			else
				unchecked++;
		}
		// If all fields were checked, don't send any fields.
		if (unchecked)
			cgip = cgip.concat(field);
	}

	// Compile the options.
	cgip = cgip.concat(options_compile(options));

	// Convert to a string.
	cgip = cgip.length > 0 ? "?" + cgip.join("&") : "";

	image.onload = imageonload;
	image.src = form.cgiurl_graph.value + "/"
		+ form.plugin_name.value
		+ "-pinpoint="
		+ parseInt(graph.epoch.start) + ","
		+ parseInt(graph.epoch.stop)
		+ ".png"
		+ cgip
	;

	divgraph.style.top = graph.offset.y + "px";
	divgraph.style.height = graph.size.y + "px";

	return ((+form.stop_epoch.value) - (+form.start_epoch.value)) / (+form.size_x.value);
}

function updateStartStop() {
	form.start_iso8601.value = new Date(form.start_epoch.value * 1000).formatDate(Date.DATE_ISO8601);
	form.stop_iso8601.value = new Date(form.stop_epoch.value * 1000).formatDate(Date.DATE_ISO8601);
}

function doZoom(event) {
	if (typeof event === "undefined")
		event = window.event;

	event.cancelBubble = true;

	if (typeof event.stopPropagation !== "undefined")
		event.stopPropagation();
	// Navigate !
	form.submit();
}

function zoomOut() {
	form.start_epoch.value = graph.epoch.start - scale * graph.size.x;
	form.stop_epoch.value= graph.epoch.stop + scale * graph.size.x;
	form.submit();
}

function fillDate(date, default_date) {
	return date + default_date.substring(date.length, default_date.length);
}

function majDates(event) {
	var default_date = "2009-01-01T00:00:00+0100";

	var start_manual = fillDate(form.start_iso8601.value, default_date);
	var stop_manual = fillDate(form.stop_iso8601.value, default_date);

	var dateRegex = /(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}).(\d{4})/;

	if (dateRegex.test(start_manual)) {
		var date_parsed = new Date(start_manual.replace(dateRegex, "$2 $3, $1 $4:$5:$6"));
		form.start_epoch.value = date_parsed.getTime() / 1000;
	}

	if (dateRegex.test(stop_manual)) {
		var date_parsed = new Date(stop_manual.replace(dateRegex, "$2 $3, $1 $4:$5:$6"));
		form.stop_epoch.value = date_parsed.getTime() / 1000;
	}

	form.submit();
}

function getXY(event, object, debug)
{
	var x, y, p;

	if (typeof object === "undefined" &&
		typeof event.offsetX !== "undefined" &&
		typeof event.offsetY !== "undefined")
		return {x: event.offsetX, y: event.offsetY};

	if (typeof event.pageX !== "undefined" &&
		typeof event.pageY !== "undefined")
	{
		x = event.pageX;
		y = event.pageY;
	}
	else
	{
		x = event.clientX;
		y = event.clientY;
	}
	p = (typeof object === "object") ?
		object :
		(typeof event.srcElement === "object") ?
			event.srcElement :
			event.target;
	do
	{
		x -= p.offsetLeft;
		y -= p.offsetTop;
		p = p.offsetParent;
	} while (p !== null);

	return {x: x, y: y};
}

function dragstart(event)
{
	var button1;
	var coords;
	var target;

	if (typeof event === "undefined")
	{
		event = window.event;
		button1 = event.button == 1;
	}
	else
		button1 = event.button == 0;

	target = (typeof event.srcElement === "object") ?
		event.srcElement :
		event.target;

	// Cancel if the target object is not this object or mouse button1.
	// was not the one pressed.
	if (this !== target || button1 === false)
		return false;

	coords = getXY(event);

	initial_left = coords.x;

	// Reset mouse movement.
	divOverlay.mouse_has_moved = false;

	// Fixed, since zoom is only horizontal
	// According to rrdgraphv on my system, the top of the graph is 33
	// pixel offset
	divOverlay.style.height = divgraph.style.height;

	// Show the div
	divOverlay.style.visibility = 'visible';
	divOverlay.style.backgroundColor = '#555';

	// Initial show
	divOverlay.style.left = coords.x + "px";
	//divOverlay.style.width = (+form.size_x.value) / 4;
	//divOverlay.style.width = 40;
	// I find that the initial width was visually irritating.  Change to 1
	// px.
	divOverlay.style.width = "1px";

	// Fix the handles
	divgraph.onmousemove = dragmove;
	divgraph.onmouseup = dragstop;
}

function dragmove(event)
{
	var delta_x;
	var size_x;
	var coords;

	if (typeof event === "undefined")
		event = window.event;

	// It's possible we can be called with the divOverlay as the target
	// instead of the divgraph.  Force divgraph.
	coords = getXY(event, divgraph);

	// Handling the borders (X1>X2 ou X1<X2)
	var current_width = coords.x - initial_left;

	if (current_width < 0) {
		divOverlay.style.left = (coords.x + 1) + "px";
		delta_x = coords.x - graph.offset.x;
		size_x = - current_width;
		divOverlay.style.width = size_x + "px"
	} else {
		divOverlay.style.left = initial_left + "px";
		delta_x = initial_left - graph.offset.x;
		size_x = current_width;
		divOverlay.style.width = size_x + "px"
	}

	// Record the fact the mouse moved.  Less than 2 pixels can be jitter
	// or some kind of click (ie single or double) where mousedown and up
	// happen without movement.  This causes it to be canceled.
	if (divOverlay.mouse_has_moved === false && delta_x > 2)
		divOverlay.mouse_has_moved = true;

	// Compute the epochs UNIX (only for horizontal)
	form.start_epoch.value = graph.epoch.start + scale * delta_x;
	form.stop_epoch.value = graph.epoch.start + scale * ( delta_x + size_x );

	// update !
	updateStartStop();
}

function dragstop(event)
{
	if (typeof event === "undefined")
		event = window.event;

	divgraph.onmousemove = null;
	divgraph.onmousedown = null;
	divgraph.onmouseup = null;
	divgraph.onmousedown = dragstart;
	divgraph.onmouseup = null;

	divOverlay.style.backgroundColor = '#000';
	divOverlay.onclick = doZoom;

	// Cancel the whole thing if the mouse hasn't moved.
	if (divOverlay.mouse_has_moved === false)
	{
		divgraph.onmousemove = null;
		divgraph.onmouseup = null;
		divgraph.onclick = null;
		divOverlay.onclick = null;

		// hide the overlay
		divOverlay.style.visibility = 'hidden';
		divOverlay.style.width = "0px";

		// reset the zoom
		form.start_epoch.value = graph.epoch.start;
		form.stop_epoch.value = graph.epoch.stop;

		updateStartStop();
	}

	return false;
}

// IE doesn't have Array.indexOf().
function myIndexOf(a, s, o)
{
	if (typeof o === "undefined")
		o = 0;

	// Call if indexOf is indeed available.
	if (typeof a.indexOf === "function")
		return a.indexOf(s, o);

	for (var i = o, j = a.length; i < j; i++)
		if (a[i] === s)
			return i;

	return -1;
}

function togglebox()
{
	this.box.checked = !this.box.checked;
	if (typeof this.box.onchange === "function")
		this.box.onchange();
	else if (typeof this.box.onclick === "function")
		this.box.onclick();
}

function toggle_fields()
{
	for (var i = 0; i < this.boxes.length; i++)
	{
		var f = this.boxes[i];
		f.checked = !f.checked;
		if (typeof f.onchange === "function")
			f.onchange();
		else if (typeof f.onclick === "function")
			f.onclick();
	}
}

// Shows or hides the gray bar over the field.  This is a visual indicator
// that the shown field has been unchecked.
function show_hide_bar()
{
	var opaque = this.checked ? 0 : 30;

	this.bar.style.opacity = opaque / 100;
	this.bar.style.filter = "alpha(opacity=" + opaque + ")";
}

// Creates the elements needed for field checkboxes and sets up the
// objects that work with it.
function init_field_list()
{
	// No field list, no checkboxes.
	if (typeof fields === "undefined")
		return;

	// Element to create the checkboxes in.
	var list = document.getElementById("field_list");

	// This is the list of fields that should be checked.  If none,
	// all fields will be checked.
	var checked_fields = qs.get("field");

	var checked = [];
	var f = fields.split(",");
	var boxes = [];

	// Less than 2 fields, no checkboxes.
	if (f.length < 2)
	{
		// Add something here so that if there is a total, the bar
		// will be in the correct place.
		active_fields.push(null);
		return;
	}
	// The template for the divs that will cover the fields in the image.
	var div_template = document.createElement("div");
	div_template.style.left = "0px";
	// This is the offset from the top of the image to the list of fields
	// minus the height of the graph.
	div_template.style.top = 65 + graph.size.y + "px";
	// Let the image onload function handle will set this.
	//div_template.style.width = "0px";
	// Assume the text is about this tall in pixels.
	div_template.style.height = "11px";
	div_template.style.zindex = 2;
	div_template.style.backgroundColor = "#000";
	div_template.style.opacity = 0;
	div_template.style.filter = "alpha(opacity=0)";
	div_template.style.position = "absolute";

	// Set the hidden field to the list of fields and their labels.
	form.fields.value = fields;

	if (typeof checked_fields === "object" &&
		checked_fields.constructor === Array)
		for (i = 0; i < checked_fields.length; checked.push(checked_fields[i++]));
	else if (typeof checked_fields == "string")
		checked = [checked_fields];

	// Add the checkboxes and labels.  Create divs to grey out the field
	// in the image.
	for (var i = 0; i < f.length; i++)
	{
		// This checkbox
		var cb = document.createElement("input");
		// The field name
		var fn = f[i].split(":", 1)[0]
		// The field label
		var text = f[i].substr(fn.length + 1);
		// The label element
		var label = document.createElement("label");

		cb.type = "checkbox";
		cb.name = "field";
		cb.value = fn;
		cb.id = "field_" + fn;
		cb = list.appendChild(cb);
		if (checked.length == 0 || myIndexOf(checked, fn) != -1)
		{
			// The grey bar over the field
			var bar = div_template.cloneNode(false);

			cb.onclick = show_hide_bar;
			bar.style.top = parseInt(bar.style.top) + (active_fields.length * 12) + "px";
			bar.id = "field" + i + "grey";
			active_fields.push(i);
			cb.checked = "true";

			// Make sure the checkbox object and bar object have
			// each other as a property.
			cb.bar = bar;
			bar.box = cb;

			// onclick isn't cloneable.  Need to define per
			// object.
			bar.onclick = togglebox;
			document.getElementById("imagediv").appendChild(bar);

			// The list of grey bars.  Used by the image onload
			// function.
			divbar.push(bar);
		}

		label.htmlFor = "field_" + fn;
		label.innerHTML = text;
		list.appendChild(label);

		list.appendChild(document.createElement("br"));

		boxes.push(cb);
	}

	// Create the toggle all button.
	var toggle = document.createElement("input");
	toggle.type = "button";
	toggle.onclick = toggle_fields;
	toggle.value = "Toggle";
	toggle.boxes = boxes;
	list.appendChild(toggle);

	// Show the field limit in the page.
	fieldtr.style.display = "";
}

// Sets up the bar for the total option
function init_graph_total(cb)
{
	if (!cb.checked)
		return;

	// Create the bar.
	var bar = document.createElement("div");

	// Setup the grey bar for total.
	bar.style.left = "0px";
	// This is the offset from the top of the image to the total field
	// minus the height of the graph.
	bar.style.top = 65 + graph.size.y + (active_fields.length * 12) + "px";
	// Let the image onload function handle will set this.
	//bar.style.width = "0px";
	// Assume the text is about this tall in pixels.
	bar.style.height = "11px";
	bar.style.zindex = 2;
	bar.style.backgroundColor = "#000";
	bar.style.opacity = 0;
	bar.style.filter = "alpha(opacity=0)";
	bar.style.position = "absolute";
	bar.onclick = togglebox;
	document.getElementById("imagediv").appendChild(bar);
	divbar.push(bar);

	cb.bar = bar;
	bar.box = cb;
	cb.onclick = show_hide_bar;
}

// Creates the options.
// opts		Array of option objects.
//		The checkbox object is added as opts[i].checkbox.
// row		Id of the element that needs to have it's visibility
//		changed.
// box		Id of the element that the checkboxes are added to.
function init_options(opts, row, box)
{
	var row = document.getElementById(row);
	var box = document.getElementById(box);
	var count = 0;

	for (var i = 0; i < opts.length; i++)
	{
		var o = opts[i];
		var oqs = o.qs;
		var checked;

		// If this is set, create the checkbox.
		if (qs.get(o.qs.html, 0) == 0)
			continue;

		if (count)
			box.appendChild(document.createElement("br"));

		// cb = checkbox, h = html parameter
		var cb = document.createElement("input");
		var h = document.createElement("input");
		var l = document.createElement("label");

		// Checkbox values.
		cb.type = "checkbox";
		cb.name = oqs.graph;
		cb.id = oqs.graph;
		cb = box.appendChild(cb);
		checked = qs.get(oqs.graph, oqs.def);

		if (checked == "on")
			checked = true;

		cb.checked = !!+checked;
		o.checkbox = cb;

		// Label for checkbox.
		l.htmlFor = cb.id;
		l.innerHTML = o.label;
		box.appendChild(l);

		// Hidden input.  Makes sure we get this option again.
		h.type = "hidden";
		h.name = oqs.html;
		h.value = 1;
		box.appendChild(h);

		if (typeof o.init === "function")
			o.init(cb);

		// Make sure that unchecked boxes get sent on the query
		// string if the default is checked.
		// I didn't like doing this, but I need a way for default
		// checked to stay unchecked.
		if (oqs.def)
		{

			// Make sure that the original onclick works.
			// NOTE: must use cb here because onclick may
			// reference "this".
			cb.onclick_real = cb.onclick;
			var hidden = document.createElement("input");

			hidden.type = "hidden";
			hidden.name = cb.name;
			hidden.value = 0;

			if (!cb.checked)
				box.appendChild(hidden);

			// When the box is clicked, add or remove the hidden
			// element created above
			cb.onclick = function ()
			{
				if (this.checked)
					box.removeChild(hidden);
				else
					box.appendChild(hidden);

				// If there was an onclick before, use it
				if (typeof cb.onclick_real === "function")
					cb.onclick_real();
			};
		}

		count++;
	}

	// If any items were found,
	if (count)
		row.style.display = "";
}

// Compiles options and returns an array of strings in the format of
// "var=val" suitable for use in the CGI query string.
function options_compile(opts)
{
	var ret = [];

	for (var i = 0; i < opts.length; i++)
	{
		var o = opts[i];
		var oqs = o.qs;
		var val;

		if (typeof o.checkbox === "undefined")
			continue;

		val = o.checkbox.checked ? oqs.checked : oqs.unchecked;
		if (typeof val === "string")
			ret.push(oqs.graph + "=" + val);
	}

	return ret;
}
