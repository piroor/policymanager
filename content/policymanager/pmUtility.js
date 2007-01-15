function goPolycyManager(modal)
{
	var WINMAN = Components.classes['@mozilla.org/appshell/window-mediator;1'].getService(Components.interfaces.nsIWindowMediator);
	var target = WINMAN.getMostRecentWindow('policymanager:ManagerDialog');
	if (target) {
		target.focus();
	}
	else {
		var modalFlag = modal ? ',modal' : '' ;
		window.openDialog('chrome://policymanager/content/policymanager.xul', '_blank', 'chrome,all,dialog'+modalFlag);
	}
	return;
}

