var PolicyService = { 
	
	// properties 
	
	// 定数 

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
 
	// 利用できるポリシー 
	get policies()
	{
		var array = (this.getPref('capability.policy.policynames') || '').split(/[,|]|\s+/);
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
   
	// 汎用関数 
	
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
 
	// スペース区切りの値リストに値を加える 
	addValueTo : function(aPrefstring, aValue)
	{
		var values = (this.getPref(aPrefstring) || '').split(/[,|]| +/);
		for (var i in values)
			if (values[i] == aValue) return false;

		values.push(aValue);
		this.setPref(aPrefstring, values.join(' ').replace(/^ | $/g, ''));
		return true;
	},
 
	// スペース区切りの値リストから値を削除する 
	removeValueFrom : function(aPrefstring, aValue)
	{
		var values = (this.getPref(aPrefstring) || '').split(/[,|]|\s+/);
		for (var i in values)
			if (values[i] == aValue) {
				values.splice(i, 1);
				this.setPref(aPrefstring, values.join(' ').replace(/^ | $/g, ''));
				return true;
			}

		return false;
	},
 
	getFaviconFor : function(aURI) 
	{
		try {
			var uri = this.FaviconService.getFaviconForPage(this.makeURIFromSpec(aURI));
			if (uri) return uri.spec;
		}
		catch(e) {
		}
		return '';
	},
  
	// ポリシーの操作 
	
	// ポリシーの定義データを得る 
	getPolicyData : function(aPolicy)
	{
		if (!aPolicy) return null;

		var root = 'capability.policy.'+encodeURIComponent(aPolicy);
		var isDefault = (aPolicy == 'default');

		var data = {
				name    : aPolicy,
				sites   : this.getSitesForPolicy(aPolicy),

				JSMode  : (this.getPref(root+'.__JSPermission__') || 'sameOrigin'),
				JS      : {},

				JSEnabled : (!this.getPref('javascript.enabled') ?
							'noAccess' :
							this.getPref(root+'.javascript.enabled') || 'allAccess'
						),

				cookie  : (
						isDefault ? this.getPref('network.cookie.cookieBehavior') :
						(this.getPref(root+'.__permission__.cookie') === null ?
							this.getPref('network.cookie.cookieBehavior') :
							this.getPref(root+'.__permission__.cookie')
						)
						),

				image   : (
						isDefault ? this.getPref('permissions.default.image') :
						(this.getPref(root+'.__permission__.image') === null ?
							0 :
							this.getPref(root+'.__permission__.image')
						)
						),

				popup   : (
						isDefault ? (this.getPref('dom.disable_open_during_load') ? 0 : 1 ) :
						(!this.getPref('dom.disable_open_during_load') ?
							1 :
							(this.getPref(root+'.__permission__.popup') === null ?
								0 :
								this.getPref(root+'.__permission__.popup')
							)
						)
						),

				install : (
						isDefault ? (this.getPref('xpinstall.enabled') ? 1 : 0 ) :
						(!this.getPref('xpinstall.enabled') ?
							0 :
							(this.getPref(root+'.__permission__.install') === null ?
								0 :
								this.getPref(root+'.__permission__.install')
							)
						)
						),

				localFileAccess : (
							this.getPref(root+'.checkloaduri.enabled') || 'sameOrigin'
						),

				clipboard : (
							(
								this.getPref(root+'.Clipboard.paste') == 'allAccess' &&
								this.getPref(root+'.Clipboard.cutcopy') == 'allAccess'
							) ? 'allAccess' : 'sameOrigin'
						)
			};

		for (var i in this.JSPrefs)
			data.JS[i] = this.getJSPermissionForPolicy(aPolicy, i);

		return data;
	},
 
	// ポリシーの追加 
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
 
	// ポリシーの編集 
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
				if (typeof this.getPref(root+'.javascript.enabled') != 'string')
					this.clearPref(root+'.javascript.enabled');

				this.setPref(root+'.javascript.enabled', data.updated.JSEnabled);
			}

			if ('cookie' in data.updated) {
				if (isDefault)
					this.setPref('network.cookie.cookieBehavior', parseInt(data.updated.cookie));
				else
					this.setPermissionFor(aPolicy, 'cookie', data.updated.cookie);
			}

			if ('image' in data.updated) {
				if (isDefault)
					this.setPref('permissions.default.image', parseInt(data.updated.image));
				else
					this.setPermissionFor(aPolicy, 'image', data.updated.image);
			}

			if ('popup' in data.updated) {
				if (isDefault)
					this.setPref('dom.disable_open_during_load', data.updated.popup != 1);
				else
					this.setPermissionFor(aPolicy, 'popup', data.updated.popup);
			}

			if ('install' in data.updated) {
				if (isDefault)
					this.setPref('xpinstall.enabled', data.updated.install == 1);
				else
					this.setPermissionFor(aPolicy, 'install', data.updated.install);
			}

			if ('localFileAccess' in data.updated) {
				if (typeof this.getPref(root+'.checkloaduri.enabled') != 'string')
					this.clearPref(root+'.checkloaduri.enabled');

				this.setPref(root+'.checkloaduri.enabled', data.updated.localFileAccess);
			}

			if ('clipboard' in data.updated) {
				this.setPref(root+'.Clipboard.cutcopy', data.updated.clipboard);
				this.setPref(root+'.Clipboard.paste', data.updated.clipboard);
			}


			if ('JSMode' in data.updated)
				this.setPref(root+'.__JSPermission__', data.updated.JSMode);

			if ('JS' in data.updated)
				for (var i in data.updated.JS)
					this.setJSPermissionForPolicy(aPolicy, i, data.updated.JS[i]);
		}

		return true;
	},
 
	// ポリシーの削除 
	removePolicy : function(aPolicy)
	{
		if (aPolicy == 'default') return false;

		// Cookie, 画像, ポップアップのパーミッション設定を消去
		this.setPermissionFor(aPolicy, 'cookie',  this.DEFAULT);
		this.setPermissionFor(aPolicy, 'image',   this.DEFAULT);
		this.setPermissionFor(aPolicy, 'popup',   this.DEFAULT);
		this.setPermissionFor(aPolicy, 'install', this.DEFAULT);

		// JavaScriptのパーミッション設定を消去
		var prefs = this.getJSPrefsForPolicy(aPolicy);
		for (var i in prefs)
		{
			try {
				this.clearPref(prefs[i]);
			}
			catch(e) {
	//			alert(e+'\n\n'+prefs[i]);
			}
		}

		// ポリシー名のリストから削除
		this.removeValueFrom('capability.policy.policynames', encodeURIComponent(aPolicy));

		return true;
	},
	
	getJSPrefsForPolicy : function(aPolicy) 
	{
		return this.Prefs.getChildList('capability.policy.'+encodeURIComponent(aPolicy)+'.', { value: 0 });
	},
  
	// 指定したタイプのJavaScriptステートメントがそのポリシーで許可されているかどうか 
	getJSPermissionForPolicy : function(aPolicy, aType)
	{
		if (!aType || !this.JSPrefs[aType] || !aPolicy) return false;

		var prefs    = this.JSPrefs[aType].split(/ /),
			enabled = false;

		var base = 'capability.policy.'+encodeURIComponent(aPolicy)+'.';
		for (var i in prefs)
			if (this.getPref(base+prefs[i]) != 'noAccess') {
				enabled = true;
				break;
			}

		return enabled;
	},
 
	// 指定したタイプのJavaScriptステートメントのそのポリシーでの許可を設定する 
	setJSPermissionForPolicy : function(aPolicy, aType, aAllow)
	{
		if (!aType || !this.JSPrefs[aType] || !aPolicy) return;

		var prefs = this.JSPrefs[aType].split(/ /),
			current;

		var value = aAllow ? (this.getPref('capability.policy.'+encodeURIComponent(aPolicy)+'.__JSPermission__') ||  'sameOrigin') : 'noAccess' ;
		var base = 'capability.policy.'+encodeURIComponent(aPolicy)+'.';
		for (var i in prefs)
			this.setPref(base+prefs[i], value);
	},
 
	// ポリシーの追加 
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
 
	// サイトをポリシーの適用対象に追加 
	addSiteToPolicy : function(aSite, aPolicy)
	{
		if (!aSite || !aPolicy) return null;

		aSite = aSite.match(/^\w+:\/\/[^\/]*/)[0];

		// 既存ポリシー設定からサイトの登録を外す
		var policies = this.policies;
		for (var i in policies)
			this.removeValueFrom('capability.policy.'+encodeURIComponent(policies[i])+'.sites', aSite);

		var root = 'capability.policy.'+encodeURIComponent(aPolicy);

		if (aPolicy != 'default')
			this.addValueTo(root+'.sites', aSite);

		// Cookie, 画像, ポップアップのパーミッション設定
		this.setPermissionFor(
			aPolicy,
			'cookie',
			(this.getPref(root+'.__permission__.cookie') === null ?
				this.DEFAULT :
				this.getPref(root+'.__permission__.cookie') ),
			aSite
		);
		this.setPermissionFor(
			aPolicy,
			'image',
			(this.getPref(root+'.__permission__.image') === null ?
				this.DEFAULT :
				this.getPref(root+'.__permission__.image') ),
			aSite
		);
		this.setPermissionFor(
			aPolicy,
			'popup',
			(this.getPref(root+'.__permission__.popup') === null ?
				this.DEFAULT :
				this.getPref(root+'.__permission__.popup') ),
			aSite
		);
		this.setPermissionFor(
			aPolicy,
			'install',
			(this.getPref(root+'.__permission__.install') === null ?
				this.DEFAULT :
				this.getPref(root+'.__permission__.install') ),
			aSite
		);

		return aSite;
	},
 
	// サイトをポリシーの適用対象から外す 
	removeSiteFromPolicy : function(aSite, aPolicy)
	{
		if (!aSite || !aPolicy) return null;

		aSite = aSite.match(/^\w+:\/\/[^\/]*/)[0];
		this.removeValueFrom('capability.policy.'+encodeURIComponent(aPolicy)+'.sites', aSite);

		// Cookie, 画像, ポップアップのパーミッション設定
		this.setPermissionFor(aPolicy, 'cookie',  this.CLEAR, aSite);
		this.setPermissionFor(aPolicy, 'image',   this.CLEAR, aSite);
		this.setPermissionFor(aPolicy, 'popup',   this.CLEAR, aSite);
		this.setPermissionFor(aPolicy, 'install', this.CLEAR, aSite);

		return aSite;
	},
 
	// ポリシーを適用するドメインを得る 
	getSitesForPolicy : function(aPolicy)
	{
		var array = (this.getPref('capability.policy.'+encodeURIComponent(aPolicy)+'.sites') || '').split(/[,|]| +/);
		array.sort();
		return array;
	},
 
	// Cookie, 画像, ポップアップのパーミッション設定 
	setPermissionFor : function(aPolicy, aType, aFlag, aSite)
	{
		if (!aPolicy && !aSite) return;

		var sites = aSite ? [aSite] : this.getSitesForPolicy(aPolicy) ;

		if (aPolicy)
			this.setPref('capability.policy.'+encodeURIComponent(aPolicy)+'.__permission__.'+aType, parseInt(aFlag));

		if (!sites.length) return;

		var i;
		var errors = [];
		switch (aFlag)
		{
			case this.ALLOW:
				for (i in sites)
				{
					try {
						if (sites[i])
							this.PermissionManager.add(this.makeURIFromSpec(sites[i]), aType, this.PermissionManager.ALLOW_ACTION);
					}
					catch(e) {
						errors.push(e);
					}
				}
				break;

			case this.DENY:
				for (i in sites)
				{
					try {
						if (sites[i])
							this.PermissionManager.add(this.makeURIFromSpec(sites[i]), aType, this.PermissionManager.DENY_ACTION);
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
						try {
							if (sites[i])
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
PolicyService.__proto__ = window['piro.sakura.ne.jp'].prefs;
  
