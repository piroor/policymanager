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

function goSelectPolicy()
{
	// ポリシー設定が一つもない場合、ポリシーマネージャを開く
	if (!PolicyService.policies.length) {
		goPolycyManager(true);
		// ポリシー設定が作られなかった場合、そのまま終了
		if (!PolicyService.policies.length)
			return;
	}
	window.openDialog('chrome://policymanager/content/selectPolicy.xul', '_blank', 'chrome,modal,centerscreen')
}
