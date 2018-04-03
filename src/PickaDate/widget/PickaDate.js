define([
    "dojo/_base/declare",
    "mxui/widget/_WidgetBase",
    "dijit/_TemplatedMixin",
    "mxui/dom",
    "dojo/dom",
    "dojo/dom-prop",
    "dojo/dom-geometry",
    "dojo/dom-class",
    "dojo/dom-style",
    "dojo/dom-construct",
    "dojo/_base/array",
    "dojo/_base/lang",
    "dojo/text",
    "dojo/html",
    "dojo/_base/event",
    "PickaDate/lib/jquery-1.11.2",
    "PickaDate/lib/picker",
    "PickaDate/lib/picker.date",
    "dojo/text!PickaDate/widget/template/PickaDate.html"
], function (declare, _WidgetBase, _TemplatedMixin, dom, dojoDom, dojoProp, dojoGeometry, dojoClass, dojoStyle, dojoConstruct, dojoArray, lang, dojoText, dojoHtml, dojoEvent, _jQuery, Picker, DatePicker, widgetTemplate) {
    "use strict";

    var $ = _jQuery.noConflict(true);

    return declare("PickaDate.widget.PickaDate", [ _WidgetBase, _TemplatedMixin ], {

        templateString: widgetTemplate,

        //Nodes
        widgetBase: null,
        pickerNode: null,
        _picker:null,
        errornode:null,

        //Modeller
        dateTime: null,
        dateFormat:null,
        entity:null,
        disabledDateAttribute: null,
        getDatesMicroflow: null,

        // Internal variables.
        _handles: null,
        _contextObj: null,

        constructor: function () {
            this._handles = [];
        },

        postCreate: function () {
            logger.debug(this.id + ".postCreate");
            dojoClass.add(this.errornode,"hidden");
        },

        update: function (obj, callback) {
            logger.debug(this.id + ".update");

            this._contextObj = obj;
            
            this._resetSubscriptions();

            var $input = $(this.pickerNode).pickadate({
                format:this.dateFormat,
                onSet:lang.hitch(this, function(thingSet){
                    console.log(thingSet); 
                    if (!thingSet.select) return;
                    this._contextObj.set(this.dateTime, thingSet.select);
                })
            });
            this._picker = $input.pickadate('picker') //handle on the date picker
            this._picker.set("select", this._contextObj.get(this.dateTime)); // set the date from the context

            mx.data.action({
                params:{
                    applyto: "selection",
                    actionname:this.getDatesMicroflow,
                    guids:[this._contextObj.getGuid()]
                },
                callback: lang.hitch(this, function(result){
                    //set the disbaled dates from the MF
                    console.log(result);

                    var dates = result.map(lang.hitch(this,function(result){
                        return new Date(result.get(this.disabledDateAttribute))
                    }));
                    this._picker.set("disable", dates);
                      

                    this._resetSubscriptions();
                    this._updateRendering(callback);

                }),
                error: lang.hitch(this, function(err){
                    
                     this._resetSubscriptions();
                    this._updateRendering(callback);
                    }),
            });
            
            this._updateRendering(callback);
        },

        _resetSubscriptions: function (){
            this.unsubscribeAll();
            //Add attribute subscription
            this.subscribe({
                guid:this._contextObj.getGuid(),
                attr:this.dateTime,
                callback: lang.hitch(this, function(guid, attr, attrValue){
                    this._picker.set("select", attrValue);
                    dojoClass.add(this.errornode,"hidden");
                })
            });

            //Add object subscription
            this.subscribe({
                guid:this._contextObj.getGuid(),
                callback: lang.hitch(this, function(guid){
                    this._picker.set("select", this._contextObj.get(this.dateTime));
                })
            });
            
            // Add validation subscription
            this.subscribe({
                guid: this._contextObj.getGuid(),
                val: true,
                callback: lang.hitch(this, function(validations){
                    console.log(validations);
                    var validation = validations[0];
                    var message = validation.getReasonByAttribute(this.dateTime);
                    this.errornode.innerHTML = message;
                    dojoClass.remove(this.errornode, "hidden")
                })
            });
        },

        resize: function (box) {
            logger.debug(this.id + ".resize");
        },

        uninitialize: function () {
            logger.debug(this.id + ".uninitialize");
        },

        _updateRendering: function (callback) {
            logger.debug(this.id + "._updateRendering");
            
            var $input = $(this.pickerNode).pickadate({
                format:this.dateFormat,
                onSet:lang.hitch(this, function(thingSet){
                    console.log(thingSet); 
                    this._contextObj.set(this.dateTime, thingSet.select);
                })
            });
            this._picker = $input.pickadate('picker') //handle on the date picker
            this._picker.set("select", this._contextObj.get(this.dateTime)); // set the date from the context


            if (this._contextObj !== null) {
                dojoStyle.set(this.domNode, "display", "block");
            } else {
                dojoStyle.set(this.domNode, "display", "none");
            }

            this._executeCallback(callback, "_updateRendering");
        },

        // Shorthand for running a microflow
        _execMf: function (mf, guid, cb) {
            logger.debug(this.id + "._execMf");
            if (mf && guid) {
                mx.ui.action(mf, {
                    params: {
                        applyto: "selection",
                        guids: [guid]
                    },
                    callback: lang.hitch(this, function (objs) {
                        if (cb && typeof cb === "function") {
                            cb(objs);
                        }
                    }),
                    error: function (error) {
                        console.debug(error.description);
                    }
                }, this);
            }
        },

        // Shorthand for executing a callback, adds logging to your inspector
        _executeCallback: function (cb, from) {
            logger.debug(this.id + "._executeCallback" + (from ? " from " + from : ""));
            if (cb && typeof cb === "function") {
                cb();
            }
        }
    });
});

require(["PickaDate/widget/PickaDate"]);
