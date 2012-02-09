/**
 * @license In-Field Label jQuery Plugin
 * http://fuelyourcoding.com/scripts/infield.html
 *
 * Copyright (c) 2009-2010 Doug Neiner
 * Dual licensed under the MIT and GPL licenses.
 * Uses the same license as jQuery, see:
 * http://docs.jquery.com/License
 *
 * @version 0.1.2
 */
(function ($) {

  // private state constants
  var BLUR = 0, // field is empty & unfocused
      FOCUS = 1, // field is empty & focused
      NOT_EMPTY = 2; // field is not empty
  
  // private transitions -- same for all instances
  var t = function(from, to) { return (from << 3) | to; },
      transitions = {};
  transitions[t( FOCUS, BLUR )]      = function(base) { base.fadeTo(1.0); };
  transitions[t( NOT_EMPTY, BLUR )]  = function(base) { base.$label.css({opacity: 1.0}).show(); };
  transitions[t( BLUR, FOCUS )]      = function(base) { base.fadeTo(base.options.fadeOpacity); };
  transitions[t( NOT_EMPTY, FOCUS )] = function(base) { base.$label.css({opacity: base.options.fadeOpacity}).show(); };
  transitions[t( BLUR, NOT_EMPTY )]  = function(base) { base.$label.hide(); };
  transitions[t( FOCUS, NOT_EMPTY )] = transitions[t( BLUR, NOT_EMPTY )];

  $.InFieldLabels = function (label, field, options) {
    // To avoid scope issues, use 'base' instead of 'this'
    // to reference this class from internal events and functions.
    var base = this;
  
    // Access to jQuery and DOM versions of each element
    base.$label = $(label);
    base.label  = label;

    base.$field = $(field);
    base.field  = field;

    base.$label.data('InFieldLabels', base);
    base.state = BLUR;

    base.init = function () {
      // Merge supplied options with default options
      base.options = $.extend({}, $.InFieldLabels.defaultOptions, options);

      if (base.options.inlineClass) {
        base.$label.addClass(base.options.inlineClass);
      }

      base.$field.on('blur focus change keyup paste', base.updateState);
      
      base.updateState();
    };


    base.fadeTo = function (opacity) {
      base.$label.stop().animate({ opacity: opacity }, base.options.fadeDuration);
    };

    base.updateState = function (e, nl) {
      var state = NOT_EMPTY;
      if (base.field.value === '') {
        var focus = e && e.type;
        if (focus === 'focus' || focus === 'keyup') {
          focus = true;
        } else if (focus === 'blur' || focus === 'change') {
          focus = false;
        } else {  // last resort because slowest
          focus = base.$field.is(':focus');
        }
        state = focus ? FOCUS : BLUR;
      }
      base.setState(state, nl);
    };

    base.setState = function (state, nl) {
      if (state === base.state) {
        return;
      }

      var transition = transitions[t(base.state, state)];
      if (typeof transition === 'function') {
        transition(base);
        base.state = state;
      } else { // unkown transition - shouldn't happen
        // nl avoids looping
        nl || base.updateState(null, true);
      }
    };

    // Run the initialization method
    base.init();
  };

  $.InFieldLabels.defaultOptions = {
    fadeOpacity: 0.5, // Once a field has focus, how transparent should the label be
    fadeDuration: 300, // How long should it take to animate from 1.0 opacity to the fadeOpacity
    inlineClass: 'in-field' // CSS class to apply to the label when it gets in-field
  };


  $.fn.inFieldLabels = function (options) {
    return this.each(function () {
      if (this.tagName !== 'LABEL') {
        return;
      }
      // Find input or textarea based on for= attribute
      // The for attribute on the label must contain the ID
      // of the input or textarea element
      var for_attr = this.getAttribute('for'), field, valid = true;
      if (!for_attr) {
        return; // Nothing to attach, since the for field wasn't used
      }

      // Find the referenced input or textarea element
      field = document.getElementById(for_attr);
      if (!field) {
        return;
      }

      if (field.tagName === 'INPUT') {
        valid = /^(?:text|search|number|tel|url|email|password)?$/.test(field.type.toLowerCase());
      } else if (field.tagName !== 'TEXTAREA') {
        valid = false;
      }
      
      valid = valid && !field.getAttribute('placeholder');

      if (!valid) {
        return; // Again, nothing to attach
      } 

      // Only create object for input[text], input[password], or textarea
      (new $.InFieldLabels(this, field, options));
    });
  };

}(jQuery));