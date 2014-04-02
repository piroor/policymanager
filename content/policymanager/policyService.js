var PolicyService = { 
	
	// properties 
	
	// �萔 

	CLEAR   : -1,
	DEFAULT : 0,
	ALLOW   : 1,
	DENY    : 2,

	JSPrefs :
	{
		open     : 'Window.open',
		close    : 'Window.close',
		dialog   : 'Window.alert Window.confirm Window.prompt Window.openDialog',
		focus    : 'Window.focus Window.blur',
		window   : 'Window.self Window.opener Window.window',
		status   : 'Window.status Window.defaultStatus',
		position : 'Window.moveBy Window.moveTo',
		scroll   : 'Window.pageXOffset Window.pageYOffset Window.scroll Window.scrollBy Window.scrollTo Window.scrollX Window.scrollY',
		resize   : 'Window.screenX.set Window.screenY.set Window.resizeBy Window.resizeTo Window.sizeToContent Window.innerHeight.set Window.innerWidth.set Window.outerHeight.set Window.outerWidth.set',
		screen   : 'Screen.availHeight Screen.availLeft Screen.availTop Screen.availWidth Screen.colorDepth Screen.height Screen.left Screen.pixelDepth Screen.top Screen.width Window.screenX.set Window.scrrenY.set',
		timer    : 'Window.setTimeout Window.setInterval',
		location : 'Location.hash.set Location.href.set Location.reload Location.replace',
		events   : 'HTMLDocument.captureEvents HTMLDocument.releaseEvents HTMLDocument.routeEvent HTMLDocument.createEvent HTMLDocument.addEventListener HTMLDocument.removeEventListener HTMLDocument.dispatchEvent'
	},

	knsISupportsString : Components.interfaces.nsISupportsString,
 
	XULAppInfo : Components.classes['@mozilla.org/xre/app-info;1']
					.getService(Components.interfaces.nsIXULAppInfo),
	comparator : Components.classes['@mozilla.org/xpcom/version-comparator;1']
					.getService(Components.interfaces.nsIVersionComparator),

	get isAvailableGeolocation() {
		return this.comparator.compare(this.XULAppInfo.version, '3.5') >= 0;
	},
	get useHTML5DragEvents() {
		return this.comparator.compare(this.XULAppInfo.version, '3.5') >= 0;
	},
 
	// ���p�ł���|���V�[ 
	get policies()
	{
		var array = (this.prefs.getPref('capability.policy.policynames') || '').split(/[,|]|\s+/);
		var result = [];
		for (var i in array)
		{
			array[i] = decodeURIComponent(array[i]);
			if (array[i]) result.push(array[i]);
		}

		result.sort();

		return result;
	},
 
	get recentURI() 
	{
		var win = this.WindowManager.getMostRecentWindow('navigator:browser');
		return (!win || !win.gBrowser) ? null : win.gBrowser.currentURI.spec ;
	},
 
	get strbundle() 
	{
		if (!this._strbundle) {
			const STRBUNDLE = Components.classes['@mozilla.org/intl/stringbundle;1'].getService(Components.interfaces.nsIStringBundleService);
			this._strbundle = STRBUNDLE.createBundle('chrome://policymanager/locale/policymanager.properties');
		}
		return this._strbundle;
	},
	_strbundle : null,
 
	get AsyncFavicons() 
	{
		if (!this._AsyncFavicons) {
			this._AsyncFavicons = Components.classes['@mozilla.org/browser/favicon-service;1']
						.getService(Components.interfaces.mozIAsyncFavicons);
		}
		return this._AsyncFavicons;
	},
	_AsyncFavicons : null,
	get FaviconService() 
	{
		if (!this._FaviconService) {
			this._FaviconService = Components.classes['@mozilla.org/browser/favicon-service;1']
				.getService(Components.interfaces.nsIFaviconService);
		}
		return this._FaviconService;
	},
	_FaviconService : null,
 
	// XPConnect 
	
	get IOService() 
	{
		if (!this._IOService) {
			this._IOService = Components.classes['@mozilla.org/network/io-service;1'].getService(Components.interfaces.nsIIOService);
		}
		return this._IOService;
	},
	_IOService : null,
 
	get PermissionManager() 
	{
		if (!this._PermissionManager) {
			this._PermissionManager = Components.classes['@mozilla.org/permissionmanager;1'].getService(Components.interfaces.nsIPermissionManager);
		}
		return this._PermissionManager;
	},
	_PermissionManager : null,
 
	get WindowManager() 
	{
		if (!this._WindowManager) {
			this._WindowManager = Components.classes['@mozilla.org/appshell/window-mediator;1'].getService(Components.interfaces.nsIWindowMediator);
		}
		return this._WindowManager;
	},
	_WindowManager : null,
 
	get PromptService() 
	{
		if (!this._PromptService)
			this._PromptService = Components.classes['@mozilla.org/embedcomp/prompt-service;1'].getService(Components.interfaces.nsIPromptService);
		return this._PromptService;
	},
	_PromptService : null,
   
	// �ėp�֐� 
	
	makeURIFromSpec : function(aURI) 
	{
		try {
			var newURI;
			aURI = aURI || '';
			if (aURI && String(aURI).indexOf('file:') == 0) {
				var fileHandler = this.IOService.getProtocolHandler('file').QueryInterface(Components.interfaces.nsIFileProtocolHandler);
				var tempLocalFile = fileHandler.getFileFromURLSpec(aURI);
				newURI = this.IOService.newFileURI(tempLocalFile); // we can use this instance with the nsIFileURL interface.
			}
			else {
				newURI = this.IOService.newURI(aURI, null, null);
			}

			return newURI;
		}
		catch(e){
		}
		return null;
	},
 
	// �X�y�[�X��؂�̒l���X�g�ɒl�������� 
	addValueTo : function(aPrefstring, aValue)
	{
		var values = (this.prefs.getPref(aPrefstring) || '').split(/[,|]| +/);
		for (var i in values)
			if (values[i] == aValue) return false;

		values.push(aValue);
		this.prefs.setPref(aPrefstring, values.join(' ').replace(/^ | $/g, ''));
		return true;
	},
 
	// �X�y�[�X��؂�̒l���X�g����l���폜���� 
	removeValueFrom : function(aPrefstring, aValue)
	{
		var values = (this.prefs.getPref(aPrefstring) || '').split(/[,|]|\s+/);
		for (var i in values)
			if (values[i] == aValue) {
				values.splice(i, 1);
				this.prefs.setPref(aPrefstring, values.join(' ').replace(/^ | $/g, ''));
				return true;
			}

		return false;
	},
 
	getFaviconFor : function(aURI, aCallback) 
	{
		try {
			if ('getFaviconForPage' in this.FaviconService) { // for legacy versions older than Firefox 21
				let uri = this.FaviconService.getFaviconForPage(this.makeURIFromSpec(aURI));
				if (uri) {
					uri = this.FaviconService.getFaviconLinkForIcon(uri).spec;
				}
				else {
					uri = '';
				}
				return aCallback(uri);
			}
			this.AsyncFavicons.getFaviconURLForPage(this.makeURIFromSpec(aURI), (function(aFaviconURI) {
				var uri = this.FaviconService.getFaviconLinkForIcon(aFaviconURI).spec;
				aCallback(uri);
			}).bind(this));
			return;
		}
		catch(e) {
		}
		aCallback('');
	},
  
	// �|���V�[�̑��� 
	
	// �|���V�[�̒�`�f�[�^�𓾂� 
	getPolicyData : function(aPolicy)
	{
		if (!aPolicy) return null;

		var root = 'capability.policy.'+encodeURIComponent(aPolicy);
		var isDefault = (aPolicy == 'default');

		var data = {
				name    : aPolicy,
				sites   : this.getSitesForPolicy(aPolicy),

				JSMode  : (this.prefs.getPref(root+'.__JSPermission__') || 'sameOrigin'),
				JS      : {},

				JSEnabled : (!this.prefs.getPref('javascript.enabled') ?
							'noAccess' :
							this.prefs.getPref(root+'.javascript.enabled') || 'allAccess'
						),

				cookie  : (
						isDefault ? this.prefs.getPref('network.cookie.cookieBehavior') :
						(this.prefs.getPref(root+'.__permission__.cookie') === null ?
							this.prefs.getPref('network.cookie.cookieBehavior') :
							this.prefs.getPref(root+'.__permission__.cookie')
						)
						),

				image   : (
						isDefault ? this.prefs.getPref('permissions.default.image') :
						(this.prefs.getPref(root+'.__permission__.image') === null ?
							0 :
							this.prefs.getPref(root+'.__permission__.image')
						)
						),

				popup   : (
						isDefault ? (this.prefs.getPref('dom.disable_open_during_load') ? 0 : 1 ) :
						(!this.prefs.getPref('dom.disable_open_during_load') ?
							1 :
							(this.prefs.getPref(root+'.__permission__.popup') === null ?
								0 :
								this.prefs.getPref(root+'.__permission__.popup')
							)
						)
						),

				install : (
						isDefault ? (!this.prefs.getPref('xpinstall.enabled') ? -1 : 0 ) :
						(!this.prefs.getPref('xpinstall.enabled') ?
							0 :
							(this.prefs.getPref(root+'.__permission__.install') === null ?
								0 :
								this.prefs.getPref(root+'.__permission__.install')
							)
						)
						),

				localFileAccess : (
							this.prefs.getPref(root+'.checkloaduri.enabled') || 'sameOrigin'
						),

				offlineApp : (
						isDefault ? (!this.prefs.getPref('dom.storage.enabled') ? -1 : 0 ) :
						(!this.prefs.getPref('dom.storage.enabled') ?
							0 :
							(this.prefs.getPref(root+'.__permission__.offline-app') === null ?
								0 :
								this.prefs.getPref(root+'.__permission__.offline-app')
							)
						)
						),

				geo : (
						isDefault ? 0 :
						(this.prefs.getPref(root+'.__permission__.geo') === null ?
							0 :
							this.prefs.getPref(root+'.__permission__.geo')
						)
						),

				clipboard : (
							(
								this.prefs.getPref(root+'.Clipboard.paste') == 'allAccess' &&
								this.prefs.getPref(root+'.Clipboard.cutcopy') == 'allAccess'
							) ? 'allAccess' : 'sameOrigin'
						)
			};

		for (var i in this.JSPrefs)
			data.JS[i] = this.getJSPermissionForPolicy(aPolicy, i);

		return data;
	},
 
	// �|���V�[�̒ǉ� 
	addPolicy : function(aPolicy, aCallBackFunc)
	{
		var data = { value : aPolicy || '' };

		if (
			!this.PromptService.prompt(
				window,
				this.strbundle.GetStringFromName('newPolicy_title'),
				this.strbundle.GetStringFromName('newPolicy_message'),
				data,
				null,
				{}
			) ||
			!data.value
			)
			return null;

		this.addValueTo('capability.policy.policynames', encodeURIComponent(data.value));

		return data.value;
	},
 
	// �|���V�[�̕ҏW 
	editPolicy : function(aPolicy, aCallBackFunc)
	{
		if (!aPolicy) return false;

		var data = this.getPolicyData(aPolicy);
		data.callBackFunc = aCallBackFunc;

		window.openDialog('chrome://policymanager/content/policyProperty.xul', '_blank', 'chrome,dialog,centerscreen,modal', data);

		if (data.updated) {
			var root = 'capability.policy.'+encodeURIComponent(aPolicy);
			var isDefault = (data.name == 'default');

			if ('JSEnabled' in data.updated) {
				if (typeof this.prefs.getPref(root+'.javascript.enabled') != 'string')
					this.prefs.clearPref(root+'.javascript.enabled');

				this.prefs.setPref(root+'.javascript.enabled', data.updated.JSEnabled);
			}

			if ('cookie' in data.updated) {
				if (isDefault)
					this.prefs.setPref('network.cookie.cookieBehavior', parseInt(data.updated.cookie));
				else
					this.setPermissionFor(aPolicy, 'cookie', data.updated.cookie);
			}

			if ('image' in data.updated) {
				if (isDefault)
					this.prefs.setPref('permissions.default.image', parseInt(data.updated.image));
				else
					this.setPermissionFor(aPolicy, 'image', data.updated.image);
			}

			if ('popup' in data.updated) {
				if (isDefault)
					this.prefs.setPref('dom.disable_open_during_load', data.updated.popup != 1);
				else
					this.setPermissionFor(aPolicy, 'popup', data.updated.popup);
			}

			if ('install' in data.updated) {
				if (isDefault)
					this.prefs.setPref('xpinstall.enabled', data.updated.install != -1);
				else
					this.setPermissionFor(aPolicy, 'install', data.updated.install);
			}

			if ('localFileAccess' in data.updated) {
				if (typeof this.prefs.getPref(root+'.checkloaduri.enabled') != 'string')
					this.prefs.clearPref(root+'.checkloaduri.enabled');

				this.prefs.setPref(root+'.checkloaduri.enabled', data.updated.localFileAccess);
			}

			if ('offlineApp' in data.updated) {
				if (isDefault)
					this.prefs.setPref('dom.storage.enabled', data.updated.offlineApp != -1);
				else
					this.setPermissionFor(aPolicy, 'offline-app', data.updated.offlineApp);
			}

			if (this.isAvailableGeolocation &&
				'geo' in data.updated) {
				if (!isDefault)
					this.setPermissionFor(aPolicy, 'geo', data.updated.geo);
			}

			if ('clipboard' in data.updated) {
				this.prefs.setPref(root+'.Clipboard.cutcopy', data.updated.clipboard);
				this.prefs.setPref(root+'.Clipboard.paste', data.updated.clipboard);
			}


			if ('JSMode' in data.updated)
				this.prefs.setPref(root+'.__JSPermission__', data.updated.JSMode);

			if ('JS' in data.updated)
				for (var i in data.updated.JS)
					this.setJSPermissionForPolicy(aPolicy, i, data.updated.JS[i]);
		}

		return true;
	},
 
	// �|���V�[�̍폜 
	removePolicy : function(aPolicy)
	{
		if (aPolicy == 'default') return false;

		// Cookie, �摜, �|�b�v�A�b�v�̃p�[�~�b�V�����ݒ������
		this.setPermissionFor(aPolicy, 'cookie',      this.DEFAULT);
		this.setPermissionFor(aPolicy, 'image',       this.DEFAULT);
		this.setPermissionFor(aPolicy, 'popup',       this.DEFAULT);
		this.setPermissionFor(aPolicy, 'install',     this.DEFAULT);
		this.setPermissionFor(aPolicy, 'offline-app', this.DEFAULT);
		if (this.isAvailableGeolocation)
			this.setPermissionFor(aPolicy, 'geo', this.DEFAULT);

		// JavaScript�̃p�[�~�b�V�����ݒ������
		var prefs = this.getJSPrefsForPolicy(aPolicy);
		for (var i in prefs)
		{
			try {
				this.prefs.clearPref(prefs[i]);
			}
			catch(e) {
	//			alert(e+'\n\n'+prefs[i]);
			}
		}

		// �|���V�[���̃��X�g����폜
		this.removeValueFrom('capability.policy.policynames', encodeURIComponent(aPolicy));

		return true;
	},
	
	getJSPrefsForPolicy : function(aPolicy) 
	{
		return this.Prefs.getChildList('capability.policy.'+encodeURIComponent(aPolicy)+'.', { value: 0 });
	},
  
	// �w�肵���^�C�v��JavaScript�X�e�[�g�����g�����̃|���V�[�ŋ�����Ă��邩�ǂ��� 
	getJSPermissionForPolicy : function(aPolicy, aType)
	{
		if (!aType || !this.JSPrefs[aType] || !aPolicy) return false;

		var prefs    = this.JSPrefs[aType].split(/ /),
			enabled = false;

		var base = 'capability.policy.'+encodeURIComponent(aPolicy)+'.';
		for (var i in prefs)
			if (this.prefs.getPref(base+prefs[i]) != 'noAccess') {
				enabled = true;
				break;
			}

		return enabled;
	},
 
	// �w�肵���^�C�v��JavaScript�X�e�[�g�����g�̂��̃|���V�[�ł̋���ݒ肷�� 
	setJSPermissionForPolicy : function(aPolicy, aType, aAllow)
	{
		if (!aType || !this.JSPrefs[aType] || !aPolicy) return;

		var prefs = this.JSPrefs[aType].split(/ /),
			current;

		var value = aAllow ? (this.prefs.getPref('capability.policy.'+encodeURIComponent(aPolicy)+'.__JSPermission__') ||  'sameOrigin') : 'noAccess' ;
		var base = 'capability.policy.'+encodeURIComponent(aPolicy)+'.';
		for (var i in prefs)
			this.prefs.setPref(base+prefs[i], value);
	},
 
	// �|���V�[�̒ǉ� 
	addNewSiteToPolicy : function(aSite, aPolicy)
	{
		var data = {
				value : aSite || this.recentURI || ''
			};

		if (
			!this.PromptService.prompt(
				window,
				this.strbundle.GetStringFromName('newSite_title').replace(/%s/gi, aPolicy),
				this.strbundle.GetStringFromName('newSite_message').replace(/%s/gi, aPolicy),
				data,
				null,
				{}
			) ||
			!data.value
			)
			return null;

		if (!/^https?:/.test(data.value)) {
			data.value = data.value.replace(/^h?t?t?p?(s?):\/\//, 'http$1://');
			if (!/^https?:/.test(data.value))
				data.value = 'http://'+data.value.replace(/^\/*/, '');
		}

		data.value = this.addSiteToPolicy(data.value, aPolicy);

		return data.value;
	},
 
	// �T�C�g���|���V�[�̓K�p�Ώۂɒǉ� 
	addSiteToPolicy : function(aSite, aPolicy)
	{
		if (!aSite || !aPolicy) return null;

		aSite = aSite.match(/^\w+:\/\/[^\/]*/)[0];

		// �����|���V�[�ݒ肩��T�C�g�̓o�^���O��
		var policies = this.policies;
		for (var i in policies)
			this.removeValueFrom('capability.policy.'+encodeURIComponent(policies[i])+'.sites', aSite);

		var root = 'capability.policy.'+encodeURIComponent(aPolicy);

		if (aPolicy != 'default')
			this.addValueTo(root+'.sites', aSite);

		// Cookie, �摜, �|�b�v�A�b�v�̃p�[�~�b�V�����ݒ�
		this.setPermissionFor(
			aPolicy,
			'cookie',
			(this.prefs.getPref(root+'.__permission__.cookie') === null ?
				this.DEFAULT :
				this.prefs.getPref(root+'.__permission__.cookie') ),
			aSite
		);
		this.setPermissionFor(
			aPolicy,
			'image',
			(this.prefs.getPref(root+'.__permission__.image') === null ?
				this.DEFAULT :
				this.prefs.getPref(root+'.__permission__.image') ),
			aSite
		);
		this.setPermissionFor(
			aPolicy,
			'popup',
			(this.prefs.getPref(root+'.__permission__.popup') === null ?
				this.DEFAULT :
				this.prefs.getPref(root+'.__permission__.popup') ),
			aSite
		);
		this.setPermissionFor(
			aPolicy,
			'install',
			(this.prefs.getPref(root+'.__permission__.install') === null ?
				this.DEFAULT :
				this.prefs.getPref(root+'.__permission__.install') ),
			aSite
		);
		this.setPermissionFor(
			aPolicy,
			'offline-app',
			(this.prefs.getPref(root+'.__permission__.offline-app') === null ?
				this.DEFAULT :
				this.prefs.getPref(root+'.__permission__.offline-app') ),
			aSite
		);
		if (this.isAvailableGeolocation)
			this.setPermissionFor(
				aPolicy,
				'geo',
				(this.prefs.getPref(root+'.__permission__.geo') === null ?
					this.DEFAULT :
					this.prefs.getPref(root+'.__permission__.geo') ),
				aSite
			);

		return aSite;
	},
 
	// �T�C�g���|���V�[�̓K�p�Ώۂ���O�� 
	removeSiteFromPolicy : function(aSite, aPolicy)
	{
		if (!aSite || !aPolicy) return null;

		aSite = aSite.match(/^\w+:\/\/[^\/]*/)[0];
		this.removeValueFrom('capability.policy.'+encodeURIComponent(aPolicy)+'.sites', aSite);

		// Cookie, �摜, �|�b�v�A�b�v�̃p�[�~�b�V�����ݒ�
		this.setPermissionFor(aPolicy, 'cookie',      this.CLEAR, aSite);
		this.setPermissionFor(aPolicy, 'image',       this.CLEAR, aSite);
		this.setPermissionFor(aPolicy, 'popup',       this.CLEAR, aSite);
		this.setPermissionFor(aPolicy, 'install',     this.CLEAR, aSite);
		this.setPermissionFor(aPolicy, 'offline-app', this.CLEAR, aSite);
		if (this.isAvailableGeolocation)
			this.setPermissionFor(aPolicy, 'geo', this.CLEAR, aSite);

		return aSite;
	},
 
	// �|���V�[��K�p����h���C���𓾂� 
	getSitesForPolicy : function(aPolicy)
	{
		var array = (this.prefs.getPref('capability.policy.'+encodeURIComponent(aPolicy)+'.sites') || '').split(/[,|]| +/);
		array.sort();
		return array;
	},
 
	// Cookie, �摜, �|�b�v�A�b�v�̃p�[�~�b�V�����ݒ� 
	setPermissionFor : function(aPolicy, aType, aFlag, aSite)
	{
		if (!aPolicy && !aSite) return;

		var sites = aSite ? [aSite] : this.getSitesForPolicy(aPolicy) ;

		if (aPolicy)
			this.prefs.setPref('capability.policy.'+encodeURIComponent(aPolicy)+'.__permission__.'+aType, parseInt(aFlag));

		if (!sites.length) return;

		var i;
		var errors = [];
		switch (aFlag)
		{
			case this.ALLOW:
				for (i in sites)
				{
					if (!sites[i]) continue;
					try {
						this.PermissionManager.add(this.makeURIFromSpec(sites[i]), aType, this.PermissionManager.ALLOW_ACTION);
						if (aType == 'offline-app')
							this.PermissionManager.add(this.makeURIFromSpec(sites[i]), aType, Components.interfaces.nsIOfflineCacheUpdateService.ALLOW_NO_WARN);
					}
					catch(e) {
						errors.push(e);
					}
				}
				break;

			case this.DENY:
				for (i in sites)
				{
					if (!sites[i]) continue;
					try {
						this.PermissionManager.add(this.makeURIFromSpec(sites[i]), aType, this.PermissionManager.DENY_ACTION);
						if (aType == 'offline-app')
							this.PermissionManager.remove(this.makeURIFromSpec(sites[i]), aType, Components.interfaces.nsIOfflineCacheUpdateService.ALLOW_NO_WARN);
					}
					catch(e) {
						errors.push(e);
					}
				}
				break;

			default:
				if (aType == 'cookie' && aFlag > -1) {
					for (i in sites)
					{
						if (!sites[i]) continue;
						try {
							this.PermissionManager.add(this.makeURIFromSpec(sites[i]), aType, this.PermissionManager.DEFAULT_ACTION);
						}
						catch(e) {
							errors.push(e);
						}
					}
					break;
				}

				var hosts = [];
				for (i in sites)
					hosts[sites[i].toString().replace(/^\w+:\/\//, '').match(/^[^\/]*/)] = true;

				var permissions = this.PermissionManager.enumerator,
					permission = [];
				while (permissions.hasMoreElements())
					permission.push(permissions.getNext().QueryInterface(Components.interfaces.nsIPermission));

				for (i in permission)
					if (hosts[permission[i].host])
						this.PermissionManager.remove(permission[i].host, aType);
				break;
		}

		if (errors.length)
			alert(
				'PolicyService::setPermissionFor() ERROR!!\n'+
				[aPolicy, aType, aFlag, aSite].join(' / ')+
				'\n----\n'+
				errors.join('\n----\n')
			);
	},
  
	___ : null 
};
PolicyService.prefs = window['piro.sakura.ne.jp'].prefs;
  
