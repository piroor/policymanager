var gData;
var gUpdatedData = { JS : {} };
var gPrefRoot;

function init()
{
	gData     = window.arguments[0];
	gPrefRoot = 'capability.policy.'+encodeURIComponent(gData.name);

	var i;
	var node;
	var isDefault = gData.name == 'default';

	document.title = document.documentElement.getAttribute('titleTemplate').replace(/%s/gi, gData.name);


	var radios = {
			JSPermissionRadio      : gData.JSEnabled,
			CookiePermissionRadio  : gData.cookie,
			ImagePermissionRadio   : gData.image,
			PopupPermissionRadio   : gData.popup,
			InstallPermissionRadio : gData.install,
			LocalFileAccessRadio   : gData.localFileAccess,
			OfflineAppRadio        : gData.offlineApp,
			GeoRadio               : gData.geo,
			ClipboardRadio         : gData.clipboard
		};
	for (i in radios)
	{
		node = document.getElementById(i);
		node.selectedItem = node.getElementsByAttribute('value', radios[i])[0];
	}
	onChangeJSRadio(document.getElementById('JSPermissionRadio').value);


	Array.slice(document.getElementsByAttribute('class', 'not-for-default')).forEach(
		isDefault ?
			function(aItem) { aItem.setAttribute('hidden', true); } :
			function(aItem) { aItem.removeAttribute('hidden'); }
	);
	Array.slice(document.getElementsByAttribute('class', 'for-default')).forEach(
		isDefault ?
			function(aItem) { aItem.removeAttribute('hidden'); } :
			function(aItem) { aItem.setAttribute('hidden', true); }
	);

	[
		{
			item     : 'ImagePermissionRadioInherit',
			hidden   : isDefault
		},
		{
			item     : 'InstallPermissionRadioDisable',
			hidden   : !isDefault
		},
		{
			item     : 'OfflineAppRadioDisable',
			hidden   : !isDefault
		},
		{
			item     : 'JSPermissionRadioAllow',
			disabled : !PolicyService.getPref('javascript.enabled')
		},
		{
			item     : 'PopupPermissionRadioDeny',
			disabled : !isDefault && !PolicyService.getPref('dom.disable_open_during_load')
		},
		{
			item     : 'InstallPermissionRadioAllow',
			disabled : isDefault || !PolicyService.getPref('xpinstall.enabled')
		},
		{
			item     : 'OfflineAppRadioAllow',
			disabled : isDefault || !PolicyService.getPref('dom.storage.enabled')
		},
		{
			item     : 'geo',
			hidden   : !PolicyService.isAvailableGeolocation
		}
	].forEach(function(aItem) {
		node = document.getElementById(aItem.item);
		if (aItem.disabled)
			node.setAttribute('disabled', true);
		else
			node.removeAttribute('disabled');

		if (aItem.hidden)
			node.setAttribute('hidden', true);
		else
			node.removeAttribute('hidden');
	});


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

	Array.slice(document.getElementsByAttribute('class', 'JScheckbox'))
		.forEach(setPermissionJS);

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
