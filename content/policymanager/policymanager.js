var gTree;
var gRoot;

function init()
{
	gTree = document.getElementById('policies');
	gRoot = document.getElementById('policies-root');

	updateState();
	resetPolicyTree();
	selectTreeAt(0);
}


function getSelectedItem()
{
	if (gTree.currentIndex < 0) return null;

	return gTree.contentView.getItemAtIndex(gTree.currentIndex);
}

function getSelectedPolicy()
{
	var item = getSelectedItem();
	if (!item) return null;

	return (item.getAttribute('class') == 'policy-item' ? item : item.parentNode.parentNode ).firstChild.firstChild.getAttribute('value');
}

function getSelectedSite()
{
	var item = getSelectedItem();
	if (!item) return null;

	return item.getAttribute('class') == 'site-item' ? item.firstChild.firstChild.getAttribute('value') : null ;
}


// for Firefox 1.0.x……クリック時に何故かonselectが機能しない。
function onClick(aEvent)
{
	var target = getCurrentIndex(aEvent);
	if (target > -1)
		selectTreeAt(target);
}

function onDblClick(aEvent)
{
	PolicyService.editPolicy(getSelectedPolicy());
}

function onSelect(aEvent)
{
	updateState();
}



function getCurrentIndex(aEvent)
{
	var row = {};
	var col = {};
	var obj = {};
	gTree.treeBoxObject.getCellAt(aEvent.clientX, aEvent.clientY, row, col, obj);

	return row.value;
}




function addPolicy()
{
	var newPolicy = PolicyService.addPolicy();
	if (!newPolicy) return;

	var node = document.getElementById('policy-'+encodeURIComponent(newPolicy));
	if (node) {
		alert(PolicyService.strbundle.GetStringFromName('newPolicy_exist'));
		return;
	}

	resetPolicyTree();

	selectTreeAt(
		gTree.contentView.getIndexOfItem(
			node
		)
	);

	PolicyService.editPolicy(newPolicy);
}

function editPolicy()
{
	PolicyService.editPolicy(getSelectedPolicy());
}

function removePolicy()
{
	if (PolicyService.removePolicy(getSelectedPolicy()))
		resetPolicyTree();
}



function addSite()
{
	var policy = getSelectedPolicy();
	var site = PolicyService.addNewSiteToPolicy('', policy);
	if (site) {
		resetPolicyTree();

		selectTreeAt(
			gTree.contentView.getIndexOfItem(
				document.getElementById('site-'+encodeURIComponent(site))
			)
		);
	}
}
function removeSite(aSite, aPolicy)
{
	var site   = aSite || getSelectedSite();
	var policy = aPolicy || getSelectedPolicy();
	if (PolicyService.removeSiteFromPolicy(site, policy)) {
		resetPolicyTree();

		if (getSelectedPolicy() != policy)
			selectTreeAt(gTree.currentIndex-1);
	}
}





// ポリシーのリストの更新
function resetPolicyTree()
{
	var selectedIndex = gTree.currentIndex;

	var range = document.createRange();
	range.selectNodeContents(gRoot);
	range.setStartAfter(gRoot.firstChild);
	range.deleteContents();
	range.detach();

	var policies = PolicyService.policies,
		policyItem,
		siteItem,
		i,
		j,
		sites,
		id,
		count;


	for (i in policies)
	{
		if (!policies[i]) continue;

		id = encodeURIComponent(policies[i]);

		policyItem = document.createElement('treeitem');
		policyItem.setAttribute('id',        'policy-'+id);
		policyItem.setAttribute('container', 'true');
		policyItem.setAttribute('open',      'true');
		policyItem.setAttribute('class',     'policy-item');

		policyItem.appendChild(document.createElement('treerow'));
		policyItem.firstChild.appendChild(document.createElement('treecell'));
		policyItem.firstChild.firstChild.setAttribute('value', policies[i]);

		policyItem.appendChild(document.createElement('treechildren'));


		count = 0;
		sites = PolicyService.getSitesForPolicy(policies[i]);
		for (j in sites)
		{
			if (!sites[j]) continue;

			count++;

			siteItem = document.createElement('treeitem');
			siteItem.setAttribute('id',    'site-'+encodeURIComponent(sites[j]));
			siteItem.setAttribute('class', 'site-item');

			siteItem.appendChild(document.createElement('treerow'));
			siteItem.firstChild.appendChild(document.createElement('treecell'));
			siteItem.firstChild.firstChild.setAttribute('label', sites[j]);
			siteItem.firstChild.firstChild.setAttribute('value', sites[j]);

			policyItem.lastChild.appendChild(siteItem);
		}


		policyItem.firstChild.firstChild.setAttribute('label', policies[i] + ' ('+count+')');

		gRoot.appendChild(policyItem);
	}

	if (selectedIndex > gTree.view.rowCount-1)
		selectedIndex--;
	if (selectedIndex != -1)
		selectTreeAt(selectedIndex);
}

function selectTreeAt(aIndex)
{
	if ('selection' in gTree.treeBoxObject) // old implementations for 1.7x
		gTree.treeBoxObject.selection.select(aIndex);
	else // new implementation for 1.8a or later
		gTree.view.selection.select(aIndex);
}




function updateState()
{
	var policy = getSelectedPolicy();
	var site   = getSelectedSite();

	var isDefault = (!policy || policy == 'default');

	var notForDefault = document.getElementById('notForDefaultItems');
	var notForPolicy  = document.getElementById('notForPolicyItems');
	var siteButtonsBox = document.getElementById('site-buttons');
	if (isDefault) {
		notForDefault.setAttribute('disabled', true);
		siteButtonsBox.setAttribute('collapsed', true);
	}
	else {
		notForDefault.removeAttribute('disabled');
		siteButtonsBox.removeAttribute('collapsed');
	}

	if (isDefault || !site)
		notForPolicy.setAttribute('disabled', true);
	else
		notForPolicy.removeAttribute('disabled');
}







var treeDNDObserver = {
	_mDS: null,
	get mDragService()
	{
		if (!this._mDS) {
			const kDSContractID = '@mozilla.org/widget/dragservice;1';
			const kDSIID = Components.interfaces.nsIDragService;
			this._mDS = Components.classes[kDSContractID].getService(kDSIID);
		}
		return this._mDS;
	},

	onDragStart: function (aEvent, aTransferData, aDragAction)
	{
		if (aEvent.originalTarget.localName != 'treechildren') return;

		var site = getSelectedSite();
		if (!site) return;

		aTransferData.data = new TransferData();
		aTransferData.data.addDataForFlavour('text/x-moz-url', site+'\n');
		aTransferData.data.addDataForFlavour('text/unicode', site);
	},

	onDrop : function(aEvent)
	{
		if (aEvent.originalTarget.localName != 'treechildren') return;

		var session = this.mDragService.getCurrentSession();
		if (!session) return;

		var flavourSet   = this.getSupportedFlavours();
		var transferData = nsTransferable.get(flavourSet, nsDragAndDrop.getDragData, true);
		var data = transferData.first.first;


		var site;
		switch(data.flavour.contentType)
		{
			case 'text/x-moz-url':
				site = data.data.split('\n')[0];
				break;

			case 'text/unicode':
				site = data.data;
				break;

			default:
				break;
		}
		if (!site) return;

		aEvent.stopPropagation();


		var target = getCurrentIndex(aEvent);
		if (target < 0) {
			var node = document.getElementById('site-'+encodeURIComponent(site));
			if (node) {
				if (confirm(PolicyService.strbundle.GetStringFromName('removeSiteConfirmMessage').replace(/%s/gi, site)))
					removeSite(site, node.parentNode.parentNode.firstChild.firstChild.getAttribute('value'));
			}
			return;
		}


		target = gTree.contentView.getItemAtIndex(target);
		if (target.getAttribute('class') == 'site-item')
			target = target.parentNode.parentNode;

		var policy = target.firstChild.firstChild.getAttribute('value');
		site = PolicyService.addSiteToPolicy(site, policy);

		resetPolicyTree();

		selectTreeAt(
			gTree.contentView.getIndexOfItem(
				document.getElementById('site-'+encodeURIComponent(site))
			)
		);
	},

	onDragOver : function(aEvent, aFlavour, aSession)
	{
		if (aEvent.originalTarget.localName != 'treechildren') return;

		var target = getCurrentIndex(aEvent);
		if (target < 0) {
			var XferDataSet = nsTransferable.get(
					this.getSupportedFlavours(),
					nsDragAndDrop.getDragData,
					true
				);
			var XferData     = XferDataSet.first.first;

			var site;
			switch(XferData.flavour.contentType)
			{
				case 'text/x-moz-url':
					site = XferData.data.split('\n')[0];
					break;

				case 'text/unicode':
					site = XferData.data;
					break;

				default:
					break;
			}
			if (site && document.getElementById('site-'+encodeURIComponent(site)))
				aSession.canDrop = true;
			else
				aSession.canDrop = false;
		}
		else
			aSession.canDrop = true;
	},

	onDragExit : function(aEvent, aFlavour, aSession)
	{
//		if (aEvent.originalTarget.localName != 'treechildren') return;
	},

	getSupportedFlavours : function () 
	{
		var flavours = new FlavourSet();
		flavours.appendFlavour('text/x-moz-url');
		flavours.appendFlavour('text/unicode');
		return flavours;
	}
}


