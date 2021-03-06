/* FTUI Plugin
 * Copyright (c) 2015-2017 Mario Stephan <mstephan@shared-files.de>
 * Under MIT License (http://www.opensource.org/licenses/mit-license.php)
 */

/* global ftui:true, Modul_famultibutton:true */

"use strict";

function depends_dimmer() {
        return ["famultibutton"];
}

var Modul_dimmer = function () {

    function init() {

        me.elements = $('div[data-type="' + me.widgetname + '"]:not([data-ready])', me.area);
        me.elements.each(function (index) {
            var elem = $(this);
            elem.attr("data-ready", "");
            
            elem.initData('off-color', ftui.getStyle('.dimmer.off', 'color') || '#2A2A2A');
            elem.initData('off-background-color', ftui.getStyle('.dimmer.off', 'background-color') || '#505050');
            elem.initData('on-color', ftui.getStyle('.dimmer.on', 'color') || '#2A2A2A');
            elem.initData('on-background-color', ftui.getClassColor(elem) || ftui.getStyle('.dimmer.on', 'background-color') || '#aa6900');
            elem.initData('background-icon', 'fa-circle');
            elem.initData('icon', 'fa-lightbulb-o');
            elem.initData('get-value', elem.data('part') || '-1');
            elem.initData('set-on', '$v');
            elem.initData('set-value', '$v');
            elem.initData('dim', '');
            elem.initData('cmd-value', 'set');
            elem.initData('max', 100);
            elem.initData('min', 0);
            elem.initData('mode', 'dimmer');

            if (elem.data('dim') !== '')
                me.addReading(elem, 'dim');
            me.init_attr(elem);
            me.init_ui(elem);
            var val = localStorage.getItem(me.widgetname + "_" + elem.data('device'));
            if (val && $.isNumeric(val)) {
                elem.data('num-value', val);
                elem.setDimValue(parseInt(val));
            }

        });
    }

    function toggleOn(elem) {
        if (elem.hasClass('lock')) {
            elem.addClass('fail-shake');
            setTimeout(function () {
                var faelem = elem.data('famultibutton');
                if (faelem) {
                    faelem.setOff();
                }
                elem.removeClass('fail-shake');
            }, 500);
            return;
        }
        var v = elem.getValue();
        if (elem.hasClass('FS20')) {
            v = ftui.FS20.dimmerValue(v);
        }
        elem.data('num-value', v);
        elem.data('value', elem.data('set-on').toString().replace('$v', v.toString()));
        elem.transmitCommand();
        elem.trigger("toggleOn");
    }

    function valueChanged(elem, v) {
        if (elem.hasClass('lock')) {
            elem.addClass('fail-shake');
            setTimeout(function () {
                var faelem = elem.data('famultibutton');
                if (faelem) {
                    faelem.setDimValue(parseInt(elem.data('num-value')));
                }
                elem.removeClass('fail-shake');
            }, 500);
            return;
        }
        var device = elem.data('device');
        localStorage.setItem(me.widgetname + "_" + device, v);
        if (elem.data('famultibutton').getState() === true || elem.data('dim') !== '') {
            if (elem.hasClass('FS20')) {
                v = ftui.FS20.dimmerValue(v);
            }
            elem.data('num-value', v);
            var valStr = elem.data('set-value').toString().replace('$v', v.toString());
            var reading = (elem.data('dim') !== '') ? elem.data('dim') : elem.data('set');
            var cmd = [elem.data('cmd-value'), device, reading, valStr].join(' ');
            ftui.setFhemStatus(cmd);
            ftui.toast(cmd);
        }
    }

    function update(dev, par) {

        // update from normal state reading
        me.elements.filterDeviceReading('get', dev, par)
            .each(function (index) {
                var elem = $(this);
                var value = elem.getReading('get').val;
                var state = ftui.getPart(value, elem.data('part'));
                if (ftui.isValid(state)) {
                    var states = elem.data('states') || elem.data('limits') || elem.data('get-on');
                    if ($.isArray(states)) {
                        me.showMultiStates(elem, states, state);
                    } else {
                        var faelem = elem.data('famultibutton');
                        if (faelem) {
                            if (elem.matchingState('get', state) === 'on') {
                                faelem.setOn();
                            }
                            if (elem.matchingState('get', state) === 'off') {
                                faelem.setOff();
                            }
                        }
                    }
                    if (!elem.isValidData('warn')) {
                        me.update_cb(elem, state);
                    }
                }
            });

        //extra reading for lock
        me.update_lock(dev, par);

        //extra reading for hide
        me.update_hide(dev, par);

        //extra reading for reachable
        me.update_reachable(dev, par);

        //extra reading for colorize
        me.elements.filterDeviceReading('dim', dev, par)
            .each(function (idx) {
                var elem = $(this);
                var value = elem.getReading('dim').val;
                if (value) {
                    var part = $(this).data('get-value');
                    var val = ftui.getPart(value, part);
                    var elemDim = $(this).data('famultibutton');
                    if (elemDim && $.isNumeric(val)) {
                        elem.data('num-value', val);
                        elemDim.setDimValue(parseInt(val));
                    }

                }
            });
    }

    function update_cb(elem, state) {
        if (elem.hasClass('warn') || elem.children().children('#fg').hasClass('warn'))
            me.showOverlay(elem, state);
        else
            me.showOverlay(elem, "");
    }

    var me = $.extend(new Modul_famultibutton(), {
        widgetname: 'dimmer',
        init: init,
        valueChanged: valueChanged,
        toggleOn: toggleOn,
        update: update,
        update_cb: update_cb,
    });

    return me;
};