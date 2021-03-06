/**
 * @brief This file holds some general JavaScript for FlexForm.
 * Currently it holds some function for select2 tokens (which will become deprecated)
 * and a function that will hold other JavaScript function until jQuery is loaded
 *
 * @file FlexForm.general.js
 * @author Sen-Sai
 *
 */

var wsAjax = false

/**
 * Show popup message. Initiated and loaded bu wsform function
 * @param  {[string]}  msg           [Text message]
 * @param  {[string]}  type          [what kind of alert (success, alert, warning, etc..)]
 * @param  {Boolean} [where=false] [where to show]
 * @param  {Boolean} [stick=false] [wether popup must be sticky or not]
 * @return
 */
function showMessage (msg, type, where = false, stick = false) {
	if (typeof $.notify === 'undefined') return
	if (where !== false) {
		if (stick) {
			where.notify(msg, type, { clickToHide: true, autoHide: false })
		} else {
			where.notify(msg, type)
		}
	} else {
		if (stick) {
			$.notify(msg, type, { clickToHide: true, autoHide: false })
		} else {
			$.notify(msg, type)
		}
	}
}

/**
 * Holds further JavaScript execution intull jQuery is loaded
 * @param method string Name of the method to call once jQuery is ready
 * @param both bool if true it will also wait until MW is loaded.
 */
function wachtff (method, both = false) {
	//console.log('wacht ff op jQuery..: ' + method.name );
	if (window.jQuery) {
		if (both === false) {
			//console.log( 'ok JQuery active.. lets go!' );
			method()
		} else {
			// console.log('wacht ff op jQuery.ui..');
			if (window.mw) {
				var scriptPath = mw.config.get('wgScript')
				if (scriptPath !== null && scriptPath !== false) {
					method()
				} else {
					setTimeout(function () {
						wachtff(method, true)
					}, 250)
				}
			} else {
				setTimeout(function () {
					wachtff(method, true)
				}, 250)
			}
		}
	} else {
		setTimeout(function () {
			wachtff(method)
		}, 50)
	}
}

function wsformShowOnSelect () {
	var lst = mw.config.get('wsformConfigVars')
	if (lst === null) return
	if (lst.showOnSelect === undefined) return
	var source = []
	// var valueToCheckBe = '';
	//  var targetBe = '';

	/**
	 * hide all targets from array
	 * @param array
	 */
	function hideAll (array) {
		$(array).each(function () {
			console.log('hide:: ', this.target)
			$('#' + this.target).hide()
		})
	}

	/**
	 * show val from array
	 * @param val
	 * @param array
	 */
	function showVal (val, array) {
		$(array).each(function () {
			if (this.val === val) {
				$('#' + this.target).show()
			}
		})
	}

	let sourceObj = {}

	/**
	 * convert array to object
	 */
	$(lst.showOnSelect).each(function (i, obj) {
		if (sourceObj.hasOwnProperty(obj.source)) {
			sourceObj[obj.source].push(obj)
		} else {
			sourceObj[obj.source] = [obj]
		}
	})

	/**
	 * loop through object and set onchange event
	 */
	$.each(sourceObj, function (k, v) {
		hideAll(v)
		$('#' + k).on('change', function (e) {
			hideAll(v)
			showVal($(this).val(), v)
		})

		$('#' + k).trigger('change')
	})
}

function startInstance () {
	console.log('initiating instance')
	//var lst = mw.config.get('wsinstance')
	var lst = window.wgInstance
	if (lst === null) return
	if (lst === undefined) return

	var instance_array = []
	var selector_array = []
	var temp_selector = ''
	$(lst).each(function (i, obj) {
		if (selector_array.includes(obj.selector)) return;
		selector_array.push(obj.selector);

		var settings = {
			draggable: obj.draggable,
			addButtonClass: obj.addButtonClass,
			removeButtonClass: obj.removeButtonClass,
			handleClass: obj.handleClass,
			selector: obj.selector,
			textarea: obj.textarea,
			list: obj.list,
			copy: obj.copy,
		}
		const instance = new WsInstance(obj.selector, settings)

		if (instance.length) {
			instance_array.push(...instance)
		} else {
			instance_array.push(instance)
		}

		temp_selector = obj.selector
	})

	/**
	 * saves all the instances in the array
	 */
	function saveAllInstancesInForm () {
		for (var i = 0; i < instance_array.length; i++) {
			instance_array[i].save()
		}
	}

	// form event
	// $(temp_selector).closest('form').on('submit', saveAllInstancesInForm)

	$.each(selector_array, (i, selector) => {
		$(selector).each((index, wrapper) => {
			$(wrapper).closest('form').find('input[type="submit"]').on('click', saveAllInstancesInForm)
			if ($(wrapper).closest('form').find('input[type="submit"]').length === 0) {
				var submit_btn = $(wrapper).closest('form').find('input[type="button"][onclick^="wsform"]')
				if (submit_btn.length === 0) return

				var onclick_func = submit_btn[0].onclick

				$(submit_btn).removeAttr('onclick')
				$(submit_btn).off('click')
				$(submit_btn).on('click', saveAllInstancesInForm)
				$(submit_btn).on('click', onclick_func)
			}
		})
	})

	window.wgInstancesArray = instance_array;
}

/*
function wsformShowOnSelect( source, val, target ) {
    $("#" + el ).on( 'change', function () {
        if ( $ (this).value === val ) {
            $("#"+target ).show();
        } else {
            $('#'+target).hide();
        }
    });
}
*/
function waitForTinyMCE (method) {
	if (typeof window.tinymce !== 'undefined') {
		method()
	} else {
		setTimeout(function () {
			waitForTinyMCE(method)
		}, 250)
	}
}

function waitForVE (method) {
	if (typeof $().applyVisualEditor === 'function') {
		method()
	} else {
		setTimeout(function () {
			waitForVE(method)
		}, 250)
	}
}

/**
 * Does FlexForm have the editor argument, then use it
 */
function initializeWSFormEditor () {
	if (typeof WSFormEditor !== 'undefined' && WSFormEditor === 'VE') {
		waitForVE(initializeVE)
	}
}

/**
 * Initialize any VisualEditors in the dom
 */
function initializeVE () {
	$('.ve-area-wrapper textarea').each(function () {
		if ($(this).prev().hasClass('ve-init-target')) return

		var textAreaContent = $(this).val()
		var pipesReplace = textAreaContent.replace(/{{!}}/gmi, '|')
		$(this).val(pipesReplace)
		$(this).applyVisualEditor()
		$(this).removeClass('load-editor')
	})

}

/**
 * Update only the VisualEditor it concerns
 *
 * @param btn
 * @param callback
 * @param preCallback
 * @param pform
 */
function updateVE (btn, callback, preCallback, pform) {

	var VEditors = $(pform).find('span.ve-area-wrapper')
	var numberofEditors = VEditors.length
	var tAreasFieldNames = []
	var tAreas = $(pform).find('textarea').each(function () {
		tAreasFieldNames.push($(this).attr('name'))
	})
	var veInstances = VEditors.getVEInstances()

	$(veInstances).each(function () {
		var instanceName = $(this)[0].$node[0].name
		if ($.inArray(instanceName, tAreasFieldNames) !== -1) {
			new mw.Api().post({
				action: 'veforall-parsoid-utils',
				from: 'html',
				to: 'wikitext',
				content: $(this)[0].target.getSurface().getHtml(),
				title: mw.config.get('wgPageName').split(/(\\|\/)/g).pop()
			})
				.then(function (data) {
					var text = data['veforall-parsoid-utils'].content
					var esc = replacePipes(text)
					var area = pform.find('textarea[name=\'' + instanceName + '\']')[0]
					$(area).val(esc)
					numberofEditors--
					if (numberofEditors === 0) {
						WSFormEditorsUpdates = true
						if (window.wsAutoSaveActive === false) {
							wsform(btn, callback, preCallback)
						} else {
							wsAutoSave(btn, true)
							window.wsAutoSaveActive = false
						}
					}
				})
				.fail(function () {
					alert('Could not initialize ve4all, see console for error')
					console.log(result)
				})
		}

	})
}

var WSFormEditorsUpdates = false
var wsFormTimeOutId = []
var wsAutoSaveActive = false

/**
 * Actual Autosave function
 *
 * @param form
 * @param reset
 */
function wsAutoSave (form, reset = false) {
	var frm = $(form).closest('form')
	var type = $(frm).attr('data-autosave')
	var mwonsuccessBackup = false
	if (typeof window.mwonsuccess === 'undefined') {
		window.mwonsuccess = 'Autosave'
	} else {
		mwonsuccessBackup = window.mwonsuccess
		window.mwonsuccess = 'Autosave'
	}
	wsAutoSaveActive = true
	if (!$(frm).hasClass('ws-edit-tracking-info--disabled')) {
		if (window.wsAjax === true) {
			$(form).click()
		} else {
			wsform(form)
		}
	} else {
		if (typeof wsFormTimeOutId !== 'undefined') {
			wsFormTimeOutId.forEach(function (value) {
				clearTimeout(value)
			})
		}
	}
	if (mwonsuccessBackup !== false) {
		window.mwonsuccess = mwonsuccessBackup
	} else {
		delete window.mwonsuccess
	}
	if (reset !== false) {
		clearTimeout(wsFormTimeOutId[reset + '_general'])
		setGlobalAutoSave(form, reset)

	}
}

/**
 *
 * @param object btn
 * @param int id
 */
function setGlobalAutoSave (btn, id) {
	var toggleBtn = $('#btn-' + id)
	wsFormTimeOutId[id + '_general'] = setTimeout(function () {
		if ($(toggleBtn).hasClass('ws-interval-on')) {
			wsAutoSave(btn, id)
		} else console.log('skipped')
	}, wsAutoSaveGlobalInterval)
}

/**
 * When TinyMCE is initiated
 * @param editorid
 */
function wsFormTinymceReady (editorid) {
	var _editor = tinymce.editors[editorid]
	var txtare = _editor.getElement()
	var form = $(txtare).closest('form')
	_editor.on('change', function (e) {
		_editor.save()
		wsSetEventsAutoSave(form)
	})
}

/**
 * @param object form
 */
function wsSetEventsAutoSave (form) {
	var type = $(form).attr('data-autosave')
	var id = $(form).attr('id')
	var btn = ''
	if (window.wsAjax) {
		$(form).find('input[type=button]').each(function () {
			if (typeof $(this).attr('onclick') !== 'undefined' && $(this).attr('onclick') !== false) {
				btn = this
			}
		})
	} else {
		btn = $('input[type=submit]', form)
	}
	if (typeof wsFormTimeOutId !== 'undefined') {
		clearTimeout(wsFormTimeOutId[id + '_general'])
		if (wsFormTimeOutId[id] !== undefined) {
			clearTimeout(wsFormTimeOutId[id])
		}
	}
	if (type === 'auto' || type === 'onchange') {
		wsFormTimeOutId[id] = setTimeout(function () {
			wsAutoSave(btn, false)
		}, wsAutoSaveOnChangeInterval)
	}
	if (type === 'auto' || type === 'oninterval') {
		setGlobalAutoSave(btn, id)
	}
}

/**
 * Interval save toggle function
 * @param element
 */
function wsToggleIntervalSave (element) {
	var id = $(element).attr('id')
	var splitResult = id.split('-')
	var formId = splitResult[1]
	var text = $(element).text()
	if ($(element).hasClass('ws-interval-on')) {
		$(element).removeClass('ws-interval-on')
		$(element).removeClass('btn-primary')
		$(element).addClass('btn-btn')
		$(element).addClass('ws-interval-off')
		$(element).text(wsAutoSaveButtonOff)
	} else {
		$(element).removeClass('ws-interval-off')
		$(element).removeClass('btn-btn')
		$(element).addClass('btn-primary')
		$(element).addClass('ws-interval-on')
		$(element).text(wsAutoSaveButtonOn)
		if (window.wsAjax) {
			$('#' + formId).find('input[type=button]').each(function () {
				if (typeof $(this).attr('onclick') !== 'undefined' && $(this).attr('onclick') !== false) {
					setGlobalAutoSave(this, formId)
				}
			})
		} else {
			$('#' + formId).find('input[type=submit]').each(function () {
				setGlobalAutoSave(this, formId)
			})
		}
	}
}

/**
 * Initialize Autosave
 */
function wsAutoSaveInit () {
	var autosaveForms = $('form.ws-autosave')
	autosaveForms.each(function () {
		var type = $(this).attr('data-autosave')
		var form = this
		var id = $(this).attr('id')
		if (typeof id === 'undefined') {
			return
		}

		if (type === 'auto' || type === 'oninterval') {
			$('<button onClick="wsToggleIntervalSave(this)" class="btn btn-primary ws-interval-on" id="btn-' + id + '">' + wsAutoSaveButtonOn + '</button>').insertBefore(form)

			$(form).find('input[type=submit]').each(function () {
				setGlobalAutoSave(this, id)
			})
		}
		if (type === 'auto' || type === 'onchange') {
			$(this).on('input paste change', 'input, select, textarea, div', function () {
				wsSetEventsAutoSave(form)
			})
		}

		checkForTinyMCE()
	})
}

/**
 * WSform Ajax handler
 * @param  {[object]}  btn              [btn that was clicked]
 * @param  {Boolean or boolean} [callback=false] [either function to callback or false if none]
 * @param preCallback
 * @param showId
 * @param preCallback
 * @param showId
 * @return {[none]}                   [run given callback]
 */
function wsform (btn, callback = 0, preCallback = 0, showId = 0) {

	if (preCallback !== 0 && typeof preCallback !== 'undefined') {
		preCallback(btn, callback)
		return
	}
	$(btn).addClass('disabled')

	if (typeof window.wgInstancesArray === 'object') {
		$.each(window.wgInstancesArray, (i, instance) => {
			instance.save()
		})
	}

	if (typeof $.notify === 'undefined') {
		var u = mw.config.get('wgScriptPath')

		if (u === 'undefined') {
			u = ''
		}

		$.getScript(u + '/extensions/FlexForm/Modules/notify.js')
	}

	var val = $(btn).prop('value')
	var frm = $(btn).closest('form')
	frm.addClass('wsform-submitting')
	showWeAreWorking(frm);

	if (typeof WSFormEditor !== 'undefined' && WSFormEditor === 'VE' && WSFormEditorsUpdates === false) {
		updateVE(btn, callback, preCallback, frm)
	} else {

		if (typeof window.mwonsuccess === 'undefined') {
			var mwonsuccess = 'Saved successfully'
		} else mwonsuccess = window.mwonsuccess
		// Added posting as user for Ajax v0.8.0.5.8
		var res = $(frm).find('input[name="wsuid"]')
		if ($(res) && $(res).length === 0) {
			var uid = getUid()
			if (uid !== false) {
				$('<input />')
					.attr('type', 'hidden')
					.attr('name', 'wsuid')
					.attr('value', uid)
					.appendTo(frm)
			}
		}

		if (window.wsAjax === false) {
			var doWeHaveField = $(frm).find('input[name="mwidentifier"]')
			if ($(doWeHaveField) && $(doWeHaveField).length === 0) {
				$('<input />')
					.attr('type', 'hidden')
					.attr('name', 'mwidentifier')
					.attr('value', 'ajax')
					.appendTo(frm)
			}
		}

		var test = frm[0].checkValidity()
		if (test === false) {
			frm[0].reportValidity()
			$(btn).removeClass('disabled')
			frm.removeClass('wsform-submitting')
			return false
		}

		var content = frm.contents()
		var dat = frm.serialize()
		var target = frm.attr('action')
		$.ajax({
			url: target,
			type: 'POST',
			data: dat,
			dataType: 'json'
		}).done(function (result) {
			$(btn).removeClass('disabled')
			frm.removeClass('wsform-submitting')
			frm.addClass('wsform-submitted')
			weAreDoneWorking(frm);
			//alert(result);
			if (window.wsAjax === false) {
				$(frm).find('input[name="mwidentifier"]')[0].remove()
			}
			if (result.status === 'ok') {
				if (showId !== 0) {
					showMessage(mwonsuccess, 'success', $('#' + showId))
				} else {
					showMessage(mwonsuccess, 'success', $(btn))
				}
				if (callback !== 0 && typeof callback !== 'undefined') {
					callback(frm)
				}
			} else {
				$.notify('FlexForm : ERROR: ' + result.message, 'error')
			}
		}).fail( function( xhr, textStatus, errorThrown ) {
			console.log( xhr, textStatus, errorThrown );
		});
		if (typeof WSFormEditor !== 'undefined' && WSFormEditor === 'VE') {
			WSFormEditorsUpdates = false
		}
	}
}

function getEditToken () {
	if (window.mw) {
		var tokens = mw.user.tokens.get()
		if (tokens.csrfToken) {
			return mw.user.tokens.get('editToken')
			//return tokens.csrfToken;
		}

	} else return false
}

function getUid () {
	if (window.mw) {
		return mw.config.get('wgUserId')
	} else return false
}

// Used for SMQ queries
function testSelect2Callback (state) {
	return state.text
}

function addTokenInfo () {
	$(document).ready(function () {

		if (typeof window.wsAutoSaveInitAjax === 'undefined') {
			wachtff(wsAutoSaveInit)
		}

		$('form.flex-form').one('submit', function (e) {
			// Check for Visual editor
			e.preventDefault()
			showWeAreWorking(this);
			var pform = $(this)
			if ($(this).data('wsform') && $(this).data('wsform') === 'wsform-general') {
				// We have a FlexForm form
				$('<input />')
					.attr('type', 'hidden')
					.attr('name', 'wsedittoken')
					.attr('value', getEditToken())
					.appendTo(this)
			}
			var res = $(this).find('input[name="wsuid"]')

			if ($(res) && $(res).length === 0) {
				var uid = getUid()
				if (uid !== false) {
					$('<input />')
						.attr('type', 'hidden')
						.attr('name', 'wsuid')
						.attr('value', uid)
						.appendTo(this)
				}
			}
			if (typeof WSFormEditor !== 'undefined' && WSFormEditor === 'VE') {
				var VEditors = $(this).find('span.ve-area-wrapper')
				if (VEditors.length === 0) {
					// normal for so submit
					pform.submit()
				}
				var numberofEditors = VEditors.length
				var tAreasFieldNames = []

				var tAreas = $(this).find('textarea').each(function () {
					tAreasFieldNames.push(this.name ? this.name : $(this).data('name'))
				})

				var veInstances = VEditors.getVEInstances()

				$(veInstances).each(function () {
					var instanceName = this.$node[0].name ? this.$node[0].name : $(this.$node[0]).data('name')
					const node = this.$node

					if ($.inArray(instanceName, tAreasFieldNames) !== -1) {

						new mw.Api().post({
							action: 'veforall-parsoid-utils',
							from: 'html',
							to: 'wikitext',
							content: $(this)[0].target.getSurface().getHtml(),
							title: mw.config.get('wgPageName').split(/(\\|\/)/g).pop()
						})
							.then(function (data) {
								if (!$(Array.from(node.parentsUntil('.WSmultipleTemplateList')).at(-1)).hasClass('WSmultipleTemplateInstance')) {
									var text = data['veforall-parsoid-utils'].content
									var esc = replacePipes(text)
									var area = pform.find('textarea[name=\'' + instanceName + '\']')[0]
									$(area).val(esc)
								}

								numberofEditors--
								if (numberofEditors === 0) {
									pform.submit()
								}
							})
							.fail(function () {
								alert('Could not initialize ve4all, see console for error')
								console.log(result)
								pform.cancel()
							})
					}

				})
			} else if( pform.find('div[id*="canvas_"]' ).length > 0 )  {
				showWeAreWorking(this);
				var canvas = pform.find('div[id*="canvas_"]' );
				if( canvas.length > 0 ) {
					//console.log( "We have a canvas!" );
					var sourceId =  $(canvas[0]).data('canvas-source');
					//console.log( 'id to get = ' + sourceId );

					var exportId = $(canvas)[0].id;
					//console.log( 'id to export = ' + exportId );
					let htmlDiv = document.getElementById( sourceId );
					html2canvas(htmlDiv).then(
						function (canvas) {
							$('<input />')
								.attr('type', 'hidden')
								.attr('name', 'ff_canvas_file')
								.attr('value', canvas.toDataURL( "image/jpeg", 100 ) )
								.appendTo(pform);
							//document.getElementById( exportId ).appendChild(canvas);
							weAreDoneWorking(pform);
							pform.submit();
						})

				} else {
					pform.submit();
				}
			} else {
				pform.submit();
			}
		})
	})

}

function showWeAreWorking (form) {
	var btn = $(form).find(':submit')
	var spinner = $(form).find('.flex-form-spinner')
	$(spinner).addClass('active')
	$(btn).addClass('flexform-disabled')
	$(btn).prop('disabled', true)
}

function weAreDoneWorking (form) {
	var btn = $(form).find(':submit')
	var spinner = $(form).find('.flex-form-spinner')
	$(spinner).removeClass('active')
	$(btn).removeClass('flexform-disabled')
	$(btn).prop('disabled', false)
}

function replacePipes (text) {
	return text.replace(/(\|)|({{[^|]+\|[^}]+}})/gm, function ($0, $1) {
		return $1 ? '{{!}}' : $0
	})
}

function attachTokens () {
	$(document).ready(function () {
		if ($('select[data-inputtype="ws-select2"]')[0]) {
			var scriptPath = mw.config.get('wgScript')
			if (scriptPath === null || !scriptPath) {
				scriptPath = ''
			}
			scriptPath = scriptPath.replace('/index.php', '')
			mw.loader.load(scriptPath + '/extensions/FlexForm/Modules/select2.min.css', 'text/css')
			$.getScript(scriptPath + '/extensions/FlexForm/Modules/select2.min.js').done(function () {
				$.getScript('https://ajax.googleapis.com/ajax/libs/jqueryui/1.13.1/jquery-ui.min.js').done(function () {
					$( 'select[data-inputtype="ws-select2"]' ).each( function () {
						var selectid = $( this ).attr( 'id' )
						var selectoptionsid = 'select2options-' + selectid
						var select2config = $( 'input#' + selectoptionsid ).val()
						var F = new Function( select2config )
						return ( F() )
					} )
				});
			})
		}
	})
}

var ffNoSubmitOnEnter = function( e ) {
	if (e.keyCode === 13) {
		e.preventDefault();
		return false
	}
}

/*
function noReturnOnEnter( id ) {
	$('#' + id).on('keyup keypress', 'input[type="text"]', ffNoSubmitOnEnter() );
	$('#' + id).on('keyup keypress', 'input[type="search"]', ffNoSubmitOnEnter() );
	$('#' + id).on('keyup keypress', 'form input[type="password"]', ffNoSubmitOnEnter() );
}
*/
function noReturnOnEnter() {
	$('.ff-nosubmit-onreturn').keypress(ffNoSubmitOnEnter);
	$('.ff-nosubmit-onreturn').keydown(ffNoSubmitOnEnter);
	$('.ff-nosubmit-onreturn').keyup(ffNoSubmitOnEnter);
}

function wsInitTinyMCE () {
	for (id in window.tinymce.editors) {
		if (id.trim()) {
			wsFormTinymceReady(id)
		}
	}
	window.tinymce.on('AddEditor', function (e) {
		wsFormTinymceReady(e.editor.id)
	})
}

function checkForTinyMCE () {
	if ($('[class^="tinymce"]')[0]) {
		if (typeof window.tinymce === 'undefined') {
			waitForTinyMCE(wsInitTinyMCE)
		} else wsInitTinyMCE()
	}
}

function createAlertsIfNeeded () {
	let alert = $('[class^="wsform alert-"]')
	if (alert !== null && alert.length > 0) {
		let type = alert.attr('class').split('-')[1]
		if (type === 'danger') type = 'error'
		if (type === 'warning') type = 'warn'
		mw.notify(alert.text(), { autoHide: false, type: type })
	}
}

/**
 * Wait for jQuery to load and initialize, then go to method addTokenInfo()
 */
wachtff(addTokenInfo)
wachtff(initializeWSFormEditor)
wachtff(checkForTinyMCE)
wachtff(createAlertsIfNeeded)

// tinyMCE stuff if needed



