(function ($) {
    "use strict";
    $.fn.pin = function (options) {
        var scrollY = 0, elements = [], disabled = false, $window = $(window);

        options = options || {};

        var recalculateLimits = function () {
            for (var i=0, len=elements.length; i<len; i++) {
                var $this = elements[i];

                if (options.minWidth && $window.width() <= options.minWidth) {
                    if ($this.parent().is(".pin-wrapper")) { $this.unwrap(); }
                    $this.css({width: "", left: "", top: "", position: ""});
                    if (options.activeClass) { $this.removeClass(options.activeClass); }
                    disabled = true;
                    continue;
                } else {
                    disabled = false;
                }

                var $container = options.containerSelector ? $this.closest(options.containerSelector) : $(document.body);
                var offset = $this.offset();
                var containerOffset = $container.offset();
                var parentOffset = $this.offsetParent().offset();

                if (!$this.parent().is(".pin-wrapper")) {
                    $this.wrap("<div class='pin-wrapper'>");
                }

                var pad = $.extend({
                  top: 0,
                  bottom: 0
                }, options.padding || {});

                var $fixContainer = null;
                if (typeof options.fixContainer === 'string') {
                  $fixContainer = $(options.fixContainer);
                }

                $this.data("pin", {
                    $container: $container,
                    containerOffset: containerOffset,
                    $this: $this,
                    pad: pad,
                    from: (options.containerSelector ? containerOffset.top : offset.top) - pad.top,
                    $fixContainer: $fixContainer,
                    to: containerOffset.top + $container.height() - $this.outerHeight() - pad.bottom,
                    end: containerOffset.top + $container.height(),
                    parentTop: parentOffset.top,
                    calcParentTop: (function ($this) {
                      return function () {
                        return $this.offsetParent().offset().top;
                      };
                    })($this),
                    calcTo: (function (containerOffset, $container, $this, pad) {
                      return function () {
                        return containerOffset.top + $container.height() - $this.outerHeight() - pad.bottom;
                      };
                    })(containerOffset, $container, $this, pad)
                });

                $this.css({width: $this.outerWidth()});
                $this.parent().css("height", $this.outerHeight());
            }
        };

        var onResize = function () {
          if (disabled) { return; }
            var elmts = [];
            for (var i=0, len=elements.length; i<len; i++) {
              var $this = $(elements[i]),
                data  = $this.data("pin");

              if (!data) { // Removed element
                continue;
              }

              elmts.push($this);
              if($this.css('position') === 'fixed' && data.$fixContainer !== null) {
                $this.css('left', data.$fixContainer.offset().left);
              }
          }
          elements = elmts;
        };

        var onScroll = function () {
            if (disabled) { return; }

            scrollY = $window.scrollTop();

            var elmts = [];
            for (var i=0, len=elements.length; i<len; i++) {
                var $this = $(elements[i]),
                    data  = $this.data("pin");

                if (!data) { // Removed element
                  continue;
                }

                elmts.push($this);

                var from = data.from - data.pad.bottom;
                var to = data.to - data.pad.top;
                if (options.dynamicHeight) {
                    to = data.calcTo() - data.pad.top;
                }

                if (from + $this.outerHeight() > data.end) {
                    $this.css('position', '');
                    continue;
                }

                var offsetTop = options.offsetTop || 0;

                if (from - offsetTop < scrollY && to > scrollY) {
                    !($this.css("position") == "fixed") && $this.css({
                        left: $this.offset().left,
                        top: data.pad.top
                    }).css('position', 'fixed');
                    if (options.activeClass) { $this.addClass(options.activeClass); }
                } else if (scrollY >= to) {
                    $this.css('position', 'absolute').css({
                        left: "",
                        top: to - data.calcParentTop() + data.pad.top
                    });
                    if (options.activeClass) { $this.addClass(options.activeClass); }
                } else {
                    $this.css({position: "", top: "", left: ""});
                    if (options.activeClass) { $this.removeClass(options.activeClass); }
                }
          }
          elements = elmts;
        };

        var update = function () { recalculateLimits(); onScroll(); };

        this.each(function () {
            var $this = $(this),
                data  = $(this).data('pin') || {};

            if (data && data.update) { return; }
            elements.push($this);
            $("img", this).one("load", recalculateLimits);
            data.update = update;
            $(this).data('pin', data);
        });

        $window.scroll(onScroll);
        $window.resize(function () {
          onResize();
          recalculateLimits();
        });

        recalculateLimits();

        $window.load(update);

        return {
          pinnedElements: elements,
          self: this,
          destroy: function () {
            var self = $(this);
            var index = elements.findIndex(function (element) {
              return JSON.stringify(element).trim() === JSON.stringify(self).trim();
            });
            if (index !== -1) {
              elements.splice(index, 1);
            }
          }
        };
      };
})(jQuery);
