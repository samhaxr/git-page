window.oldjQuery = window.jQuery;
window.jQuery = window.oneJQuery;
/*---------------------------------------------------------------------------------------------

@author       Constantin Saguin - @brutaldesign
@link         http://csag.co
@github       http://github.com/One-com/shinybox
@version      5.1.0
@license      MIT License

----------------------------------------------------------------------------------------------*/
(function (factory) {
    if (typeof exports === 'object') {
        module.exports = factory(require('jQuery'));
    } else if (typeof define === 'function' && define.amd) {
        define(['jquery'], factory);
    } else {
        window.Shinybox = factory(jQuery);
    }
}(function ($) {
    (function (window, document, $, undefined) {
        var $window = $(window);
        var $html = $('html');
        var $body = $(document.body);
        var isMobile = navigator.userAgent.match(/(iPad)|(iPhone)|(iPod)|(Android)|(PlayBook)|(BB10)|(BlackBerry)|(Opera Mini)|(IEMobile)|(webOS)|(MeeGo)/i);
        var isTouch = isMobile !== null || document.createTouch !== undefined || 'ontouchstart' in window || 'onmsgesturechange' in window || navigator.msMaxTouchPoints;
        var supportSVG = !!document.createElementNS && !!document.createElementNS('http://www.w3.org/2000/svg', 'svg').createSVGRect;
        var supportCssTransition = checkForCssTransitionSupport();
        var windowDimensions = getWindowDimensions();
        var resizeOps = [function () {
                windowDimensions = getWindowDimensions();
            }];
        $window.resize(function (e) {
            resizeOps.forEach(function (operation) {
                operation(e);
            });
        });
        if ('onorientationchange' in window) {
            window.addEventListener('orientationchange', function () {
                windowDimensions = getWindowDimensions();
            }, false);
        }
        var defaultOptions = {
            id: 'shinybox-overlay',
            useCSS: true,
            noTitleCaptionBox: false,
            hideCloseButtonOnMobile: false,
            loopAtEnd: false,
            showNavigationsOnMobile: false,
            initialIndexOnArray: 0,
            sort: null,
            videoMaxWidth: 1140,
            autoplayVideos: false,
            vimeoColor: 'CCCCCC',
            queryStringData: {},
            beforeOpen: noop,
            afterClose: noop,
            afterMedia: noop,
            afterSlide: noop,
            verticalSwipeDisable: false
        };
        function Shinybox(element, options) {
            var self = this instanceof Shinybox ? this : {};
            var settings = $.extend({}, defaultOptions, options);
            var selector = element.selector;
            var eventCatcher, $selectedElements;
            settings.afterDestroy = function () {
                eventCatcher.trigger('shinybox-destroy');
                self.ui = null;
            };
            if ($.isArray(element)) {
                eventCatcher = $window;
                self.destroy = function () {
                    self.ui && self.ui.destroy();
                };
                self.refresh = function () {
                    self.destroy();
                    self.ui = new UI(element, settings);
                    eventCatcher.trigger('shinybox-start');
                    self.ui.openWithSlide(settings.initialIndexOnArray);
                };
            } else {
                function openShinyboxOnClick(e) {
                    if (e.target.parentNode.className === 'slide current') {
                        return false;
                    }
                    e.preventDefault();
                    e.stopPropagation();
                    self.ui && self.ui.destroy();
                    var $this = $(this);
                    var relType = 'data-rel';
                    var relVal = $this.attr(relType);
                    if (!relVal) {
                        relType = 'rel';
                        relVal = $this.attr(relType);
                    }
                    var $slideElements;
                    if (relVal && relVal !== 'nofollow') {
                        $slideElements = $selectedElements.filter('[' + relType + '="' + relVal + '"]');
                    } else {
                        $slideElements = $(selector);
                    }
                    var filteredSlides = Array.prototype.filter.call($slideElements, function (slideElement) {
                        return !$(slideElement).data('ignore');
                    });
                    var index = typeof $this.data('dom-index') !== 'undefined' ? $this.data('dom-index') - $(filteredSlides[0]).data('dom-index') : $(filteredSlides).index($this);
                    var slides = Array.prototype.map.call(filteredSlides, function (slideElement) {
                        var $slideElement = $(slideElement);
                        return {
                            href: $slideElement.attr('href') || null,
                            title: $slideElement.attr('title') || null,
                            caption: $slideElement.attr('caption') || null,
                            srcset: $slideElement.attr('data-srcset') || null
                        };
                    });
                    eventCatcher = $(e.target);
                    self.ui = new UI(slides, settings);
                    eventCatcher.trigger('shinybox-start');
                    self.ui.openWithSlide(index);
                }
                self.destroy = function () {
                    $selectedElements && $selectedElements.off('click', openShinyboxOnClick);
                    self.ui && self.ui.destroy();
                };
                self.refresh = function () {
                    self.destroy();
                    $selectedElements = element;
                    if (settings.sort) {
                        $selectedElements.sort(settings.sort);
                    }
                    $selectedElements.on('click', openShinyboxOnClick);
                };
            }
            self.refresh();
            return self;
        }
        function UI(slides, settings) {
            this.slides = slides;
            this.settings = settings;
            this.currentX = 0;
            this.build();
        }
        UI.prototype.build = function () {
            this.overlay = $('<div id="' + this.settings.id + '"  class="shinybox-overlay" />');
            this.closeButton = $('<a class="shinybox-close" />');
            this.captionBox = $('<div class="shinybox-caption captionTitle"></div>');
            this.caption = $('<p class="caption"></p>');
            this.title = $('<p class="title"></p>');
            this.captionBox.append(this.title, this.caption);
            this.navigationContainer = $('<div class="navigationContainer"></div>');
            this.slider = $('<div class="shinybox-slider"></div>');
            this.prevButton = $('<a class="shinybox-prev" />');
            this.nextButton = $('<a class="shinybox-next" />');
            this.navigationContainer.append(this.prevButton, this.nextButton);
            this.overlay.append(this.slider, this.closeButton, this.captionBox, this.navigationContainer);
            if (isMobile) {
                this.overlay.addClass('mobile-view');
            }
            if (this.settings.noTitleCaptionBox) {
                this.overlay.addClass('noTitleCaptionBox');
            }
            if (!this.settings.showNavigationsOnMobile) {
                this.navigationContainer.addClass('hideMe');
            }
            $body.append(this.overlay);
            this.slides.forEach(function () {
                this.slider.append('<div class="slide"></div>');
            }, this);
            this.slideElements = this.slider.find('.slide');
            this.updateDimensions();
            this.setupButtonNavigation();
            this.setupGestureNavigation();
            this.setupKeyboardNavigation();
            this.setupWindowResizeEvent();
        };
        UI.prototype.doCssTrans = function () {
            return this.settings.useCSS && supportCssTransition;
        };
        UI.prototype.updateDimensions = function () {
            var dimensions = $.extend({}, windowDimensions);
        };
        UI.prototype.setupButtonNavigation = function () {
            var self = this;
            if (this.slides.length < 2) {
                this.navigationContainer.hide();
            } else {
                this.prevButton.on('click touchend', function (e) {
                    e.preventDefault();
                    e.stopPropagation();
                    self.getPrev();
                });
                this.nextButton.on('click touchend', function (e) {
                    e.preventDefault();
                    e.stopPropagation();
                    self.getNext();
                });
            }
            this.closeButton.on('click touchend', function (e) {
                e.preventDefault();
                e.stopPropagation();
                self.destroy();
            });
            this.slideElements.click(function (e) {
                if (e.target === this && e.target.children.length >= 1) {
                    self.destroy();
                }
            });
        };
        UI.prototype.setupGestureNavigation = function () {
            if (!isTouch) {
                return;
            }
            var self = this;
            var index;
            var hDistance, vDistance;
            var hDistanceLast, vDistanceLast;
            var hDistancePercent;
            var vSwipe = false;
            var hSwipe = false;
            var hSwipMinDistance = 10;
            var vSwipMinDistance = 50;
            var startCoords = {};
            var endCoords = {};
            var touchMoveEventHandler = function (e) {
                e.preventDefault();
                e.stopPropagation();
                endCoords = e.originalEvent.targetTouches[0];
                if (!hSwipe && !self.settings.verticalSwipeDisable) {
                    vDistanceLast = vDistance;
                    vDistance = endCoords.pageY - startCoords.pageY;
                    if (Math.abs(vDistance) >= vSwipMinDistance || vSwipe) {
                        var opacity = 0.75 - Math.abs(vDistance) / self.slider.height();
                        self.slider.css({
                            top: vDistance + 'px',
                            opacity: opacity
                        });
                        vSwipe = true;
                    }
                }
                hDistanceLast = hDistance;
                hDistance = endCoords.pageX - startCoords.pageX;
                hDistancePercent = hDistance * 100 / windowDimensions.width;
                if (!hSwipe && !vSwipe && Math.abs(hDistance) >= hSwipMinDistance) {
                    self.slider.addClass('notransition');
                    hSwipe = true;
                }
                if (hSwipe) {
                    if (0 < hDistance) {
                        self.moveSlider(self.currentX + (0 === index ? 4 : hDistancePercent));
                    } else if (0 > hDistance) {
                        self.moveSlider(self.currentX + (self.slides.length === index + 1 ? -4 : hDistancePercent));
                    }
                }
            };
            var touchPoints = null;
            this.overlay.on('touchstart', function (e) {
                if (e.originalEvent.touches && e.originalEvent.touches.length > 1) {
                    $(this).off('touchmove', touchMoveEventHandler);
                    return true;
                }
                e.preventDefault();
                e.stopPropagation();
                index = self.getCurrentIndex();
                endCoords = e.originalEvent.targetTouches[0];
                touchPoints = e.originalEvent.targetTouches;
                startCoords.pageX = e.originalEvent.targetTouches[0].pageX;
                startCoords.pageY = e.originalEvent.targetTouches[0].pageY;
                self.moveSlider(self.currentX);
                $(this).on('touchmove', touchMoveEventHandler);
            });
            this.overlay.on('touchend', function (e) {
                if (e.originalEvent.touches && e.originalEvent.touches.length > 1) {
                    $(this).off('touchmove', touchMoveEventHandler);
                    return true;
                }
                e.stopPropagation();
                self.slider.removeClass('notransition');
                vDistance = endCoords.pageY - startCoords.pageY;
                hDistance = endCoords.pageX - startCoords.pageX;
                var hasOneTouchPoint = touchPoints.length === 1;
                if (vSwipe && !self.settings.verticalSwipeDisable) {
                    vSwipe = false;
                    if (Math.abs(vDistance) >= 2 * vSwipMinDistance && Math.abs(vDistance) > Math.abs(vDistanceLast) && hasOneTouchPoint) {
                        var vOffset = vDistance > 0 ? self.slider.height() : -self.slider.height();
                        self.slider.animate({
                            top: vOffset + 'px',
                            opacity: 0
                        }, 300, function () {
                            self.destroy();
                        });
                    } else {
                        self.slider.animate({
                            top: 0,
                            opacity: 1
                        }, 300);
                    }
                } else if (hSwipe) {
                    hSwipe = false;
                    if (hDistance >= hSwipMinDistance && hDistance >= hDistanceLast && hasOneTouchPoint) {
                        self.getPrev();
                    } else if (hDistance <= -hSwipMinDistance && hDistance <= hDistanceLast && hasOneTouchPoint) {
                        self.getNext();
                    }
                }
                self.moveSlider(self.currentX);
                $(this).off('touchmove', touchMoveEventHandler);
            });
        };
        UI.prototype.setupKeyboardNavigation = function () {
            var self = this;
            this._keyDownEvent = function (e) {
                if (!self.isOpen) {
                    return true;
                }
                if (e.keyCode === 37 || e.keyCode === 8) {
                    e.preventDefault();
                    e.stopPropagation();
                    self.getPrev();
                } else if (e.keyCode === 39) {
                    e.preventDefault();
                    e.stopPropagation();
                    self.getNext();
                } else if (e.keyCode === 27) {
                    e.preventDefault();
                    e.stopPropagation();
                    self.destroy();
                }
            };
            $window.on('keydown', this._keyDownEvent);
        };
        UI.prototype.setupWindowResizeEvent = function () {
            var self = this;
            this.resizeIndex = resizeOps.push(function () {
                self.updateDimensions();
            }) - 1;
        };
        UI.prototype.validateIndex = function (index) {
            if (index < 0 || index > this.slides.length - 1) {
                return 0;
            }
            return index;
        };
        UI.prototype.getCurrentIndex = function () {
            return this.slideElements.index(this.slideElements.filter('.current'));
        };
        UI.prototype.moveSlider = function (x) {
            if (this.doCssTrans()) {
                this.slider.css({ left: x + '%' });
            } else {
                this.slider.animate({ left: x + '%' });
            }
        };
        UI.prototype.setSlide = function (index, isFirst) {
            isFirst = isFirst || false;
            index = this.validateIndex(index);
            this.currentX = -index * 100;
            this.moveSlider(this.currentX);
            this.slideElements.removeClass('current');
            this.slideElements.eq(index).addClass('current');
            this.setTitle(index);
            if (isFirst) {
                this.slider.fadeIn();
            }
            if (!this.settings.loopAtEnd) {
                this.prevButton.removeClass('disabled');
                this.nextButton.removeClass('disabled');
                if (index === 0) {
                    this.prevButton.addClass('disabled');
                } else if (index === this.slides.length - 1) {
                    this.nextButton.addClass('disabled');
                }
            }
            this.settings.afterSlide(this.slideElements.filter('.current').children(), index);
        };
        UI.prototype.setTitle = function (index) {
            index = this.validateIndex(index);
            var title = this.slides[index].title;
            var caption = this.slides[index].caption;
            if (!title && !caption) {
                this.captionBox.addClass('noTitleCaption');
            } else {
                this.captionBox.removeClass('noTitleCaption');
            }
            this.caption.text(caption || '');
            this.title.text(title || '');
        };
        UI.prototype.openWithSlide = function (index) {
            index = this.validateIndex(index);
            var nextIndex = index < this.slides.length - 1 ? index + 1 : 0;
            var prevIndex = index > 0 ? index - 1 : this.slides.length - 1;
            this.open();
            this.setSlide(index);
            this.preloadMedia(index);
            if (this.settings.loopAtEnd || nextIndex !== 0) {
                this.preloadMedia(nextIndex);
            }
            if (this.settings.loopAtEnd || prevIndex !== this.slides.length - 1) {
                this.preloadMedia(prevIndex);
            }
        };
        UI.prototype.getNext = function () {
            var self = this;
            var currentIndex = this.getCurrentIndex();
            var nextIndex = currentIndex + 1 < this.slides.length ? currentIndex + 1 : 0;
            var preloadIndex = nextIndex + 1 < this.slides.length ? nextIndex + 1 : 0;
            if (this.settings.loopAtEnd || currentIndex + 1 < this.slides.length) {
                this.resetIframeInSlide(currentIndex);
                this.setSlide(nextIndex);
                this.preloadMedia(preloadIndex);
            } else {
                this.overlay.addClass('rightSpring');
                setTimeout(function () {
                    self.overlay.removeClass('rightSpring');
                }, 500);
            }
        };
        UI.prototype.getPrev = function () {
            var self = this;
            var currentIndex = this.getCurrentIndex();
            var prevIndex = currentIndex > 0 ? currentIndex - 1 : this.slides.length - 1;
            var preloadIndex = prevIndex > 0 ? prevIndex - 1 : this.slides.length - 1;
            if (this.settings.loopAtEnd || currentIndex > 0) {
                this.resetIframeInSlide(currentIndex);
                this.setSlide(prevIndex);
                this.preloadMedia(preloadIndex);
            } else {
                this.overlay.addClass('leftSpring');
                setTimeout(function () {
                    self.overlay.removeClass('leftSpring');
                }, 500);
            }
        };
        UI.prototype.resetIframeInSlide = function (index) {
            index = this.validateIndex(index);
            var iframeInSlide = this.slideElements.eq(index).contents().find('iframe');
            if (iframeInSlide.length) {
                iframeInSlide.attr('src', iframeInSlide.attr('src'));
            }
        };
        UI.prototype.preloadMedia = function (index) {
            index = this.validateIndex(index);
            var self = this;
            var src = this.slides[index].href;
            var srcset = this.slides[index].srcset;
            if (!this.isVideo(src)) {
                setTimeout(function () {
                    self.openMedia(index, src, srcset);
                }, 300);
            } else {
                this.openMedia(index, src, srcset);
            }
        };
        UI.prototype.openMedia = function (index, src, srcset) {
            index = this.validateIndex(index);
            var self = this, title = this.slides[index].title || '', alt = this.slides[index].alt || title;
            if (!src) {
                src = this.slides[index].href;
            }
            if (!srcset) {
                srcset = this.slides[index].srcset;
            }
            if (!src) {
                return false;
            }
            var $slide = this.slideElements.eq(index);
            if (this.isVideo(src)) {
                $slide.html(this.getVideo(src));
                this.settings.afterMedia($slide.children(), index);
            } else if (this.isPDF(src)) {
                $slide.html(this.getPDF(src));
                this.settings.afterMedia($slide.children(), index);
            } else {
                $slide.html('<div class="loadingWrapper"><div class="loading"></div></div>');
                this.loadMedia(src, srcset, function (media) {
                    media.attr('title', title);
                    media.attr('alt', alt);
                    $slide.html(media);
                    self.settings.afterMedia($slide.children(), index);
                });
            }
        };
        UI.prototype.loadMedia = function (src, srcset, callback) {
            callback = callback || noop;
            if (src.trim().indexOf('#') === 0) {
                callback($('<div class="shinybox-inline-container" />').append($(src).clone()));
            } else {
                var img = $('<img>').on('load', function () {
                    callback(img);
                });
                img.attr('src', src);
                img.attr('srcset', srcset);
            }
        };
        UI.prototype.open = function () {
            this.isOpen = true;
            this.settings.beforeOpen();
            $html.addClass('shinybox-html');
            if (isMobile && this.settings.hideCloseButtonOnMobile) {
                $html.addClass('shinybox-no-close-button');
            }
            $window.trigger('resize');
        };
        UI.prototype.close = function () {
            $html.removeClass('shinybox-html shinybox-no-close-button');
            $window.trigger('resize');
            this.settings.afterClose();
            this.isOpen = false;
        };
        UI.prototype.destroy = function () {
            this.close();
            $window.off('keydown', this._keyDownEvent);
            resizeOps.splice(this.resizeIndex, 1);
            this.overlay.remove();
            this.settings.afterDestroy();
        };
        UI.prototype.isPDF = function (src) {
            return !!src && src.match(/\.pdf(?:\?|$)/);
        };
        UI.prototype.getPDF = function (url) {
            var iframe = '<iframe src="' + url + '">';
            return '<div class="shinybox-pdf-container"><div class="shinybox-pdf">' + iframe + '</div></div>';
        };
        UI.prototype.isVideo = function (src) {
            if (src) {
                if (src.match(/(youtube\.com|youtube-nocookie\.com)\/watch\?v=([a-zA-Z0-9\-_]+)/) || src.match(/vimeo\.com\/([0-9]*)/) || src.match(/youtu\.be\/([a-zA-Z0-9\-_]+)/)) {
                    return true;
                }
                if (src.toLowerCase().indexOf('shinyboxvideo=1') >= 0) {
                    return true;
                }
            }
        };
        UI.prototype.parseURI = function (uri, customData) {
            var a = document.createElement('a'), qs = {};
            a.href = decodeURIComponent(uri);
            if (a.search) {
                qs = JSON.parse('{"' + a.search.toLowerCase().replace('?', '').replace(/&/g, '","').replace(/=/g, '":"') + '"}');
            }
            if ($.isPlainObject(customData)) {
                qs = $.extend(qs, customData, this.settings.queryStringData);
            }
            return $.map(qs, function (val, key) {
                if (val && val > '') {
                    return encodeURIComponent(key) + '=' + encodeURIComponent(val);
                }
            }).join('&');
        };
        UI.prototype.getVideo = function (url) {
            var iframe = '';
            var output = '';
            var youtubeUrl = url.match(/((?:www\.)?youtube\.com|(?:www\.)?youtube-nocookie\.com)\/watch\?v=([a-zA-Z0-9\-_]+)/);
            var youtubeShortUrl = url.match(/(?:www\.)?youtu\.be\/([a-zA-Z0-9\-_]+)/);
            var vimeoUrl = url.match(/(?:www\.)?vimeo\.com\/([0-9]*)/);
            var qs = '';
            if (youtubeUrl || youtubeShortUrl) {
                if (youtubeShortUrl) {
                    youtubeUrl = youtubeShortUrl;
                }
                qs = this.parseURI(url, {
                    'autoplay': this.settings.autoplayVideos ? '1' : '0',
                    'v': ''
                });
                iframe = '<iframe width="560" height="315" src="//' + youtubeUrl[1] + '/embed/' + youtubeUrl[2] + '?' + qs + '" frameborder="0" allowfullscreen></iframe>';
            } else if (vimeoUrl) {
                qs = this.parseURI(url, {
                    'autoplay': this.settings.autoplayVideos ? '1' : '0',
                    'byline': '0',
                    'portrait': '0',
                    'color': this.settings.vimeoColor
                });
                iframe = '<iframe width="560" height="315"  src="//player.vimeo.com/video/' + vimeoUrl[1] + '?' + qs + '" frameborder="0" webkitAllowFullScreen mozallowfullscreen allowFullScreen></iframe>';
            } else {
                iframe = '<iframe width="560" height="315" src="' + url + '" frameborder="0" allowfullscreen></iframe>';
            }
            return '<div class="shinybox-video-container" style="max-width:' + this.settings.videomaxWidth + 'px"><div class="shinybox-video">' + iframe + '</div></div>';
        };
        $.shinybox = Shinybox;
        $.fn.shinybox = function (options) {
            var instance = this.data('_shinybox');
            if (instance && options === 'destroy') {
                instance.destroy();
                return this.removeData('_shinybox');
            }
            if (!instance) {
                var shinybox = new Shinybox(this, options);
                this.data('_shinybox', shinybox);
            }
            return this.data('_shinybox');
        };
        return Shinybox;
        function noop() {
        }
        function checkForCssTransitionSupport() {
            var prefixes = [
                'transition',
                'WebkitTransition',
                'MozTransition',
                'OTransition',
                'msTransition',
                'KhtmlTransition'
            ];
            return prefixes.some(function (prefix) {
                return document.createElement('div').style[prefix] !== undefined;
            });
        }
        function getWindowDimensions() {
            return {
                width: window.innerWidth ? window.innerWidth : $window.width(),
                height: window.innerHeight ? window.innerHeight : $window.height()
            };
        }
    }(window, document, $));
}));
(function ($) {
    var isMobile = false, initializeShinyBox = function (el, noTitleCaptionBox) {
            if (el.length === 0)
                return;
            el.shinybox({
                verticalSwipeDisable: true,
                beforeOpen: function () {
                    if (isMobile) {
                        $('.shinybox-overlay').addClass('mobile-view');
                    } else {
                        $('.shinybox-overlay').removeClass('mobile-view');
                    }
                },
                noTitleCaptionBox: noTitleCaptionBox,
                sort: function (a, b) {
                    if ($(a).length) {
                        var ap = $(a).offset(), bp = $(b).offset();
                        if (ap.top - bp.top !== 0) {
                            return ap.top - bp.top;
                        } else if (ap.left - bp.left !== 0) {
                            return ap.left - bp.left;
                        } else {
                            return $(a).data('dom-index') - $(b).data('dom-index');
                        }
                    } else {
                        return 1;
                    }
                }
            });
        }, tagCaptionEnabledLightbox = function () {
            var $this = $(this);
            initializeShinyBox($this.find('.shinybox'), $this.find('div[data-captionenabled=\'true\']').length === 0);
        };
    $('.shinybox').each(function (index) {
        $(this).attr('data-dom-index', index);
    });
    initializeShinyBox($('div[data-kind="IMAGE"] .shinybox'), false);
    $('div[data-kind="GALLERY"]').each(tagCaptionEnabledLightbox);
    $(window).one('changed-to-mobile-view', function () {
        isMobile = true;
    });
}(oneJQuery));
window.jQuery = window.oldjQuery;