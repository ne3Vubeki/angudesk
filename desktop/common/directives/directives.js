'use strict';

app.directive('pxCompile', function($compile) {
    return {
        restrict: 'A',
        link: function(scope, element, attrs) {
            scope.$watch(
                function(scope) {
                    return scope.$eval(attrs.compile);
                },
                function(value) {
                    element.html(value);
                    $compile(element.contents())(scope);
                }
            )
        }
    }
});

app.directive('autocomplete', function($log, $timeout) {
    return {
        require: 'ngModel',
        link: function(scope,elem,attr,ngModel){
            $timeout( function() {
                ngModel.$setViewValue(elem.val());
            }, 500);
            elem.bind('blur', function() {
                ngModel.$setViewValue(elem.val());
            });
            elem.bind('change', function() {
                ngModel.$setViewValue(elem.val());
            });
        }
    }
});

app.directive('menuUser', function() {
	return {
		restrict: 'A',
		link: function(scope, elem, attr) {
			var body = angular.element(document.body),
				menuClose = function() {
					elem.removeClass('active');
					body.unbind('click');
				};

			elem.bind('click', function(event) {
				if(elem.hasClass('active')) {
					menuClose();
				} else {
					angular.element(document.getElementsByClassName(elem.attr('class'))).removeClass('active');
					elem.addClass('active');
				}
				event.preventDefault();
				event.stopPropagation();

				body.bind('click', function(event) {
					menuClose();
				});
			});
		}
	}
});

// Focused input directive
app.directive('inputFocus', function() {
	return {
		link: function(scope, elm, attr) {
			elm[0].focus();
		}
	};
});

app.directive('onShow', ['$barley', function($barley) {
	return {
		restrict: 'A',
		link: function(scope, elem, attr) {
			var deskBack = $('.desktop__background');
			scope.$on('thePageLoaded', function() {
				$(elem).parent().fadeIn(400);
				$barley.hide(deskBack);
			});
		}
	};
}]);

app.directive('smartLoad', ['$timeout', function($timeout) {
	return {
		restrict: 'A',
		link: function(scope, elem, attr) {
			$(elem).find('img, iframe').each( function() {
				$(this).load( function() {
					scope.$emit('thisItemLoaded', $(this));
				});
			});
			var loadedTimer = function() {
					return $timeout( function() {
						scope.$emit('thePageLoaded');
						scope.$broadcast('thePageLoaded');
					}, 2000);
				},
				timeId = loadedTimer();
			scope.$on('thisItemLoaded', function(event, elem) {
				$timeout.cancel(timeId);
				timeId = loadedTimer();
			});
		}
	};
}]);



// Social authorization service FaceBook, GooglePlus, vKontakte
app.directive('socialAuth', ['$query', '$rootScope', '$window', 'gpAuth', 'fbAuth', 'vkAuth', function($query, $rootScope, $window, gpAuth, fbAuth, vkAuth) {
	function _query(options, scope) {
		$query.
			post('/ios/' + $rootScope.apiVersion + '/joinSocial/',	options).
			then( function (data) {
				if(data.error) {
					scope.error = data.message;
				}
				else
				if(data.user) {
					scope.$emit('authorizeOn', data.user);
				}
			}, function(error) {
				var e = error;
			});
	}

	return {
		restrict: 'A',
		link: function(scope, elem, attr) {

			var type = attr.socialAuth,
				api = {
					googleplus: '//apis.google.com/js/client:plusone.js',
					facebook: '//connect.facebook.net/en_US/all.js',
					vkontakte: '//vkontakte.ru/js/api/openapi.js'
				},
				scriptAsincLoad = function(url) {
					var po = document.createElement('script'); po.type = 'text/javascript'; po.async = true;
					po.src = url;
					elem[0].insertBefore(po, elem.children()[0]);
				};
			switch(type) {
				case 'facebook':
					$window.fbAsyncInit = function() {
						$rootScope.$apply(function() {
							FB.init({
								appId: app.social[type].token,
								channelUrl: app.social[type].url,
								status: true,
								cookie: true,
								xfbml: false
							});
						});
					};
					break;
				case 'vkontakte':
					$window.vkAsyncInit = function () {
						$rootScope.$apply(function() {
							VK.init({
								apiId: app.social[type].token
							});
						});
					};
					break;
			}
			scriptAsincLoad(api[type]);

			elem.bind('click', function() {
				switch(type) {
					case 'facebook':
						fbAuth.
							login().
							then( function(data) {
								var options = {
									typeSocial: type,
									sid: data['id'],
									name: data['first_name'],
									lastName: data['last_name']
								};
								if (!data['error']) {
									_query(options, scope);
								}
							}, function(error) {
							});
						break;
					case 'googleplus':
						gpAuth.
							login().
							then( function (data) {
								var options = {
									typeSocial: type,
									sid: data['id'],
									name: data['given_name'],
									lastName: data['family_name']
								};
								if (!data['error']) {
									_query(options, scope);
								}
							}, function(error) {
							});
						break;
					case 'vkontakte':
						vkAuth.
							login().
							then( function (data) {
								var options = {
									typeSocial: type,
									sid: data['uid'],
									name: data['first_name'],
									lastName: data['last_name']
								};
								if (!data['error']) {
									_query(options, scope);
								}
							}, function(error) {
							});
						break;
				}
			});
		}
	}
}]);

app.directive('popup', ['$query', '$document', '$compile', function($query, $document, $compile) {
	return {
		restrict: 'EA',
		templateUrl: '/' + app.DIR + '/templates/popUp.html',
		link: function(scope, elem, attr) {
			var close = function() {
					$document.find('body').css('overflow', 'auto');
					$(elem).find('#jsPopupCenter').fadeOut(500, function() {
						$(elem).fadeOut(200, function() {
							this.remove();
						});
					});
				},
				open = function() {
					$(elem).fadeIn(200, function() {
						$document.find('body').css('overflow', 'hidden');
						$(this).find('#jsPopupWindow').css({ width: attr.width, height: (attr.height ? attr.height : 'auto') })
							.parent().fadeIn(500);
					});
				};
			// localization template
			if(attr.url) {
				$query.
					json(attr.url, attr.urlBase ? true : undefined).
					then(function(dat) {
						scope.popupLocale = {};
						for(var key in dat) {
							scope.popupLocale[key] = dat[key];
						}
						// load template
						$query.
							html(attr.url, attr.urlBase ? true : undefined).
							then( function(data) {
								// insert html to DOM
								$(elem).find('#jsPopupContent').append($compile(data)(scope));
								open();
							});
						scope.$broadcast('popupOpened');
					});
			}
			else {
				open();
			}

			// bind event click on closer
			$(elem).find('#jsPopupCloser').bind('click', function() {
				close();
			});

			// bind event popupClose
			scope.$on('popupClose', function() {
				close();
			});
		}
	};
}]);

app.directive('barley', ['$timeout', '$compile', function($timeout, $compile) {
	return {
		restrict: 'EA',
		link: function(scope, elem, attr) {
			var widthBox = parseInt(attr.barleyWidth),
				borDer = .08,
				addBord = widthBox * borDer,
				barleyItems = parseInt(attr.barleyCount),
				widthBar = widthBox / 2 - addBord / 2, i,
				path = [
				{
					top: 0,
					left: 0
				},
				{
					top: (widthBar + addBord) + 'px',
					left: 0
				},
				{
					top: (widthBar + addBord) + 'px',
					left: (widthBar + addBord) + 'px'
				},
				{
					top: 0,
					left: (widthBar + addBord) + 'px'
				}
			];
			elem.css({ width: widthBox + 'px', height: widthBox + 'px'});
			for(i = 0; i < barleyItems - 1; i++) {
				var quad = document.createElement('div');
				$(quad).addClass('barley__init ' + 'jsInit' + i).css(path[i]).css({ width: widthBar +'px', height: widthBar + 'px'});
				elem.append(quad);
			}
			var pos = 3, j = pos;
			i = 0;
			setInterval( function() {
				j = j < barleyItems ? j : 0;
				$(elem).find('.jsInit' + i++).animate(path[j++], 500, 'easeOutQuad');
				if(i >= barleyItems - 1) {
					pos = (pos - 1) < 0 ? 3 : pos - 1;
					j = pos;
					i = 0;
				}
			}, 400);
			// bind event popupClose
			scope.$on('barleyClose', function(event, elem) {
				elem.find('barley').remove();
			});
		}
	};
}]);
