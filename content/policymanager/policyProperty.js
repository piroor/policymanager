var gData;
var gUpdatedData = { JS : {} };
var gPrefRoot;

function init()
{
	var i;

	gData     = window.arguments[0];
	gPrefRoot = 'capability.policy.'+encodeURIComponent(gData.name);

	document.title = document.documentElement.getAttribute('titleTemplate').replace(/%s/gi, gData.name);


	var node;

	node = document.getElementById('JSPermissionRadio');
	node.selectedItem = node.getElementsByAttribute('value', gData.JSEnabled)[0];
	onChangeJSRadio(node.value);

	node = document.getElementById('CookiePermissionRadio');
	node.selectedItem = node.getElementsByAttribute('value', gData.cookie)[0];

	node = document.getElementById('ImagePermissionRadio');
	node.selectedItem = node.getElementsByAttribute('value', gData.image)[0];

	node = document.getElementById('PopupPermissionRadio');
	node.selectedItem = node.getElementsByAttribute('value', gData.popup)[0];

	node = document.getElementById('InstallPermissionRadio');
	node.selectedItem = node.getElementsByAttribute('value', gData.install)[0];


	var radio     = document.getElementsByAttribute('class', 'not-for-default');
	var max       = radio.length;
	var isDefault = gData.name == 'default';
	if (isDefault) {
		for (i = 0; i < max; i++)
			radio[i].setAttribute('hidden', true);
	}
	else {
		for (i = 0; i < max; i++)
			radio[i].removeAttribute('hidden');
	}


	node = document.getElementById('JSPermissionRadio').getElementsByAttribute('value', 'allAccess')[0];
	if (PolicyService.getPref('javascript.enabled'))
		node.removeAttribute('disabled');
	else
		node.setAttribute('disabled', true);

	node = document.getElementById('PopupPermissionRadio').getElementsByAttribute('value', '0')[0];
	if (!isDefault && !PolicyService.getPref('dom.disable_open_during_load'))
		node.setAttribute('disabled', true);
	else
		node.removeAttribute('disabled');

	node = document.getElementById('InstallPermissionRadio').getElementsByAttribute('value', '1')[0];
	if (!isDefault && !PolicyService.getPref('xpinstall.enabled'))
		node.setAttribute('disabled', true);
	else
		node.removeAttribute('disabled');





	document.getElementById('JS-allAccess').checked = (gData.JSMode == 'allAccess');

	for (i in gData.JS)
		document.getElementsByAttribute('jspref', i)[0].checked = gData.JS[i];
}

function onAccept()
{
	gData.updated = gUpdatedData;
	window.close();
}

function onCancel()
{
	window.close();
}




function onChangeRadio(aType, aValue)
{
	gUpdatedData[aType] = aValue;
}

function onChangeJSRadio(aValue)
{
	gUpdatedData.JSEnabled = aValue;

	var node = document.getElementById('JSItems');
	if (aValue == 'allAccess')
		node.removeAttribute('disabled');
	else
		node.setAttribute('disabled', true);
}




function changePermissionJS()
{
	var currentPermission = gUpdatedData.JSMode || gData.JSMode;
	gUpdatedData.JSMode = currentPermission == 'sameOrigin' ? 'allAccess' : 'sameOrigin' ;

	var check = document.getElementsByAttribute('class', 'JScheckbox');
	var max   = check.length;
	for (var i = 0; i < max; i++)
		setPermissionJS(check[i]);

	document.getElementById('JS-allAccess').checked = (currentPermission != 'allAccess');
}

function setPermissionJS(target)
{
	if (target.localName != 'checkbox') return;

	var prefKey = target.getAttribute('jspref');
	var enabled = (prefKey in gUpdatedData.JS) ? gUpdatedData.JS[prefKey] : gData.JS[prefKey] ;

	gUpdatedData.JS[prefKey] = !enabled;

	target.checked = gUpdatedData.JS[prefKey];
}
