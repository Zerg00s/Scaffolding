var spf = spf || {};
spf.ribbon = spf.ribbon || {};

spf.ribbon.ribbonReady = function(callback, webPartId){
	var webPartId = webPartId || "WebPartWPQ2"; 
	SP.SOD.executeOrDelayUntilScriptLoaded(function() {        
		var pm = SP.Ribbon.PageManager.get_instance();		
	    var spRibbon = null;				
		pm.add_ribbonInited(function() {
			spRibbon = pm.get_ribbon();
			spf.ribbon.spRibbon = spRibbon;
			if(callback && typeof callback === "function"){
				callback();
			}
		});
		
		var wp = _spWebPartComponents[webPartId];
		if(wp){
			var ft = wp["firstTabId"];
			if (ft) {
				SelectRibbonTab(ft, true);
			}
		}  			
	}, "sp.ribbon.js");
};

spf.ribbon.ribbonReady2 = function(callback){
    if (typeof spf.ribbon.spRibbon === "undefined"){
        SP.SOD.executeOrDelayUntilScriptLoaded(function () {
            spf.ribbon._loading = true;
            var target = document.getElementById("MSOZoneCell_WebPartWPQ2");
            if (target != null) {
                var fakeEvent = new Array();
                fakeEvent["target"] = target;
                fakeEvent["srcElement"] = target;
                WpClick(fakeEvent);
            }
        }, "sp.ribbon.js");
    }
    var spRibbon = null;
    try { spRibbon = (SP.Ribbon.PageManager.get_instance()).get_ribbon(); } catch(ex){}
    if(spRibbon !== null){
        spf.ribbon.spRibbon = spRibbon;
        if(callback && typeof callback === "function"){
            callback();
        }
    } else {
        spf.ribbon._tries = spf.ribbon._tries || 0;
        if(spf.ribbon._tries < 1000){
            spf.ribbon._tries += 1;
            setTimeout(function(){
                spf.ribbon.ribbonReady(callback);
            }, 10);
        }
    }
};

spf.ribbon.getRibbonTab = function(tabModel){
    var ribbonTab = null;
    if(typeof spf.ribbon.spRibbon !== "undefined"){
        ribbonTab = spf.ribbon.spRibbon.getChild(tabModel.Id);
        if (ribbonTab == null) {
            ribbonTab = new CUI.Tab(spf.ribbon.spRibbon, 
                                    tabModel.Id, tabModel.Title, tabModel.Description, tabModel.Command, 
                                    false, null, null);
            spf.ribbon.spRibbon.addChild(ribbonTab);
        }
    }
    return ribbonTab;
};

spf.ribbon.getRibbonGroup = function(groupModel, tabObj){
    var ribbonGroup = null;
    if(typeof spf.ribbon.spRibbon !== "undefined" || typeof tabObject !== "undefined"){
        ribbonGroup = tabObj.getChild(groupModel.Id);
        if (ribbonGroup == null) {
            ribbonGroup = new CUI.Group(spf.ribbon.spRibbon, 
                                        groupModel.Id, groupModel.Title, groupModel.Description, groupModel.Command, 
                                        null);           
            tabObj.addChild(ribbonGroup);    
        }
    }
    return ribbonGroup;
};

spf.ribbon.getRibbonLayout = function(layoutModel, groupObj){
    var ribbonLayout = null;
    if(typeof spf.ribbon.spRibbon !== "undefined" && typeof groupObj !== "undefined"){
        ribbonLayout = groupObj.getChild(layoutModel.Id);
        if (ribbonLayout == null) {
            ribbonLayout = new CUI.Layout(spf.ribbon.spRibbon, layoutModel.Id, layoutModel.Title);
            groupObj.addChild(ribbonLayout);                       
        }
    }
    return ribbonLayout;
};

spf.ribbon.getRibbonSection = function(sectionModel, layoutObj){
    var ribbonSection = null;
    if(typeof spf.ribbon.spRibbon !== "undefined" && typeof layoutObj !== "undefined"){
        ribbonSection = layoutObj.getChild(sectionModel.Id);
        if (ribbonSection == null) {
            ribbonSection = new CUI.Section(spf.ribbon.spRibbon, sectionModel.Id, sectionModel.Row, sectionModel.Pos);            
            layoutObj.addChild(ribbonSection);     
        }
    }
    return ribbonSection;
};

spf.ribbon.getRibbonCommand = function(commandModel, sectionObj){
    var ribbonCommand = null;
    if(typeof spf.ribbon.spRibbon !== "undefined" && typeof sectionObj !== "undefined"){
        var sectionRow = sectionObj.getRow(commandModel["Row"] || 1);
        ribbonCommand = sectionRow.getChild(commandModel.Id);
        if (ribbonCommand == null) {                        
            
            if(commandModel["BeforeInitAction"] && typeof commandModel["BeforeInitAction"] === "function"){
                commandModel["BeforeInitAction"](commandModel);
            }
            
            commandModel["BeforeInitActions"] = commandModel["BeforeInitActions"] || [];
            for(var i = 0, len = commandModel["BeforeInitActions"].length; i < len; i += 1){            	
            	if(commandModel["BeforeInitActions"][i] && typeof commandModel["BeforeInitActions"][i] === "function"){
	                commandModel["BeforeInitActions"][i](commandModel);
	            }
            }
                        
            var controlProperties = new CUI.ControlProperties();
            for (var prop in commandModel) {
              if (commandModel.hasOwnProperty(prop)) {
                controlProperties[prop] = commandModel[prop];
              }
            }
            //var ribbonControl = new CUI.Controls.Button(spf.ribbon.spRibbon, commandModel.Id, controlProperties);
            
	        //console.log(commandModel.Id);
            
            var ribbonControl = new CUI.Controls[commandModel.ControlType || "Button"](spf.ribbon.spRibbon, commandModel.Id, controlProperties);

            //var controlComponent = ribbonControl.createComponentForDisplayMode('Large');
            var controlComponent = new CUI.ControlComponent(spf.ribbon.spRibbon, commandModel.Id, commandModel.Size, ribbonControl);

            ribbonControl.$$d_onClick = function(){                
                if(this.className.indexOf("ms-cui-disabled") === -1){
                    var CommandAction = commandModel["CommandAction"];
                    if(CommandAction && typeof CommandAction === "function"){
                        CommandAction(ribbonControl);
                    }
                }
            };

            ribbonControl.$$d_launchToolTip = function(){}; 

            if(commandModel["AdminEnabledStatus"] === true){
            	commandModel["DefaultEnabledStatus"] = false;
                commandModel["EnabledScriptInterval"] = 5000;
			    commandModel["EnabledScript"] = function(ribbonControl){
			    	return ribbonControl.DefaultEnabledStatus;
			    };
			    commandModel["InitActions"] = commandModel["InitActions"] || [];
			    commandModel["InitActions"].push(function(ribbonControl){
			    	spf.utils.hasUserWebManagePermissions(function(){
			    		ribbonControl.DefaultEnabledStatus = true;
			    	}, function(){
			    		ribbonControl.DefaultEnabledStatus = false;
			    	});
			    });
            }

            var EnabledScriptInterval = commandModel["EnabledScriptInterval"] || 1000;
            if(commandModel["EnabledScript"] && typeof commandModel["EnabledScript"] === "function"){
                ribbonControl.EnabledScriptInterval = EnabledScriptInterval;
                ribbonControl.EnabledScript = function(ribbonControl){
                    ribbonControl.set_enabled(commandModel["EnabledScript"](ribbonControl) || false);
                    setTimeout(function(){
                        ribbonControl.EnabledScript(ribbonControl);
                    }, ribbonControl.EnabledScriptInterval);
                }
                ribbonControl.EnabledScript(ribbonControl);
            }

            sectionRow.addChild(controlComponent); 

            if(commandModel["InitAction"] && typeof commandModel["InitAction"] === "function"){
                commandModel["InitAction"](ribbonControl);
            }
                        
            
            commandModel["InitActions"] = commandModel["InitActions"] || [];
            for(var i = 0, len = commandModel["InitActions"].length; i < len; i += 1){            	
            	if(commandModel["InitActions"][i] && typeof commandModel["InitActions"][i] === "function"){
	                //console.log(ribbonControl);
	                commandModel["InitActions"][i](ribbonControl);
	            }
            }

            ribbonCommand = ribbonControl;           
        }
        var layoutName = sectionObj.get_parent().get_title(); // sectionObj.get_parent().$1N_0 || sectionObj.get_parent().$1W_0;
        sectionObj.get_parent().get_parent().selectLayout(layoutName); // To refresh the ribbon view
        //RefreshCommandUI();
    }
    return ribbonCommand;
};

spf.ribbon.buildRibbon = function(ribbonModel){
	spf.ribbon.ribbonModel = ribbonModel;
    ribbonModel.Tabs = ribbonModel.Tabs || [];
    for(var ti = 0, tLen = ribbonModel.Tabs.length; ti < tLen; ti += 1){
        // Default properties 
        ribbonModel.Tabs[ti].Id = ribbonModel.Tabs[ti].Id || "SPF.Tab" + (ti+1);
        ribbonModel.Tabs[ti].Title = ribbonModel.Tabs[ti].Title || "Tab " + (ti+1);
        ribbonModel.Tabs[ti].Description = ribbonModel.Tabs[ti].Description || "";
        ribbonModel.Tabs[ti].Command = ribbonModel.Tabs[ti].Command || ribbonModel.Tabs[ti].Id + ".Command";

        var tabObj = spf.ribbon.getRibbonTab(ribbonModel.Tabs[ti]);
        ribbonModel.Tabs[ti].Object = tabObj;
        ribbonModel.Tabs[ti].Groups = ribbonModel.Tabs[ti].Groups || [];
        for(var gi = 0, gLen = ribbonModel.Tabs[ti].Groups.length; gi < gLen; gi += 1){
            // Default properties 
            ribbonModel.Tabs[ti].Groups[gi].Id = ribbonModel.Tabs[ti].Groups[gi].Id || ribbonModel.Tabs[ti].Id + ".Group" + (gi+1);                       
            ribbonModel.Tabs[ti].Groups[gi].Title = ribbonModel.Tabs[ti].Groups[gi].Title || "Group " + (gi+1);
            ribbonModel.Tabs[ti].Groups[gi].Description = ribbonModel.Tabs[ti].Groups[gi].Description || "";
            ribbonModel.Tabs[ti].Groups[gi].Command = ribbonModel.Tabs[ti].Groups[gi].Command || ribbonModel.Tabs[ti].Groups[gi].Id + ".Command";

            var groupObj = spf.ribbon.getRibbonGroup(ribbonModel.Tabs[ti].Groups[gi], tabObj);
            ribbonModel.Tabs[ti].Groups[gi].Object = groupObj;
            ribbonModel.Tabs[ti].Groups[gi].Layouts = ribbonModel.Tabs[ti].Groups[gi].Layouts || [];
            for(var li = 0, lLen = ribbonModel.Tabs[ti].Groups[gi].Layouts.length; li < lLen; li += 1){
                // Default properties 
                ribbonModel.Tabs[ti].Groups[gi].Layouts[li].Id = ribbonModel.Tabs[ti].Groups[gi].Layouts[li].Id || ribbonModel.Tabs[ti].Groups[gi].Id + ".Layout" + (li+1);
                ribbonModel.Tabs[ti].Groups[gi].Layouts[li].Title = ribbonModel.Tabs[ti].Groups[gi].Layouts[li].Title || "Group " + (gi+1) + " Layout " + (li+1);

                var layoutObj = spf.ribbon.getRibbonLayout(ribbonModel.Tabs[ti].Groups[gi].Layouts[li], groupObj);
                ribbonModel.Tabs[ti].Groups[gi].Layouts[li].Object = layoutObj;
                ribbonModel.Tabs[ti].Groups[gi].Layouts[li].Sections = ribbonModel.Tabs[ti].Groups[gi].Layouts[li].Sections || [];
                for(var si = 0, sLen = ribbonModel.Tabs[ti].Groups[gi].Layouts[li].Sections.length; si < sLen; si += 1){
                    // Default properties 
                    ribbonModel.Tabs[ti].Groups[gi].Layouts[li].Sections[si].Id = ribbonModel.Tabs[ti].Groups[gi].Layouts[li].Sections[si].Id || ribbonModel.Tabs[ti].Groups[gi].Layouts[li].Id + ".Section" + (si+1);
                    ribbonModel.Tabs[ti].Groups[gi].Layouts[li].Sections[si].Row = ribbonModel.Tabs[ti].Groups[gi].Layouts[li].Sections[si].Row || 2; // 2 == OneRow, 3 == TwoRows, 4 == ThreeRows
                    ribbonModel.Tabs[ti].Groups[gi].Layouts[li].Sections[si].Pos = ribbonModel.Tabs[ti].Groups[gi].Layouts[li].Sections[si].Pos || "Top";

                    var sectionObj = spf.ribbon.getRibbonSection(ribbonModel.Tabs[ti].Groups[gi].Layouts[li].Sections[si], layoutObj);
                    ribbonModel.Tabs[ti].Groups[gi].Layouts[li].Sections[si].Object = sectionObj;
                    ribbonModel.Tabs[ti].Groups[gi].Layouts[li].Sections[si].Commands = ribbonModel.Tabs[ti].Groups[gi].Layouts[li].Sections[si].Commands || [];
                    for(var ci = 0, cLen = ribbonModel.Tabs[ti].Groups[gi].Layouts[li].Sections[si].Commands.length; ci < cLen; ci += 1){
                        // Default properties
                        // https://msdn.microsoft.com/ru-ru/library/office/Ff458366.aspx
                        ribbonModel.Tabs[ti].Groups[gi].Layouts[li].Sections[si].Commands[ci].ControlType = ribbonModel.Tabs[ti].Groups[gi].Layouts[li].Sections[si].Commands[ci].ControlType || "Button";
                        ribbonModel.Tabs[ti].Groups[gi].Layouts[li].Sections[si].Commands[ci].Id = ribbonModel.Tabs[ti].Groups[gi].Layouts[li].Sections[si].Commands[ci].Id || ribbonModel.Tabs[ti].Groups[gi].Layouts[li].Sections[si].Id + ".Control" + (ci+1);                                                
                        ribbonModel.Tabs[ti].Groups[gi].Layouts[li].Sections[si].Commands[ci].Command = ribbonModel.Tabs[ti].Groups[gi].Layouts[li].Sections[si].Commands[ci].Command || ribbonModel.Tabs[ti].Groups[gi].Layouts[li].Sections[si].Commands[ci].Id;
                        if(ribbonModel.Tabs[ti].Groups[gi].Layouts[li].Sections[si].Commands[ci].ControlType === "Button"){
	                        ribbonModel.Tabs[ti].Groups[gi].Layouts[li].Sections[si].Commands[ci].Size = ribbonModel.Tabs[ti].Groups[gi].Layouts[li].Sections[si].Commands[ci].Size || "Large";
							ribbonModel.Tabs[ti].Groups[gi].Layouts[li].Sections[si].Commands[ci].Image16by16 = ribbonModel.Tabs[ti].Groups[gi].Layouts[li].Sections[si].Commands[ci].Image16by16 || "_layouts/15/images/placeholder16x16.png";
	                        ribbonModel.Tabs[ti].Groups[gi].Layouts[li].Sections[si].Commands[ci].Image32by32 = ribbonModel.Tabs[ti].Groups[gi].Layouts[li].Sections[si].Commands[ci].Image32by32 || "_layouts/15/images/placeholder32x32.png";	                        
	                   	} else {
	                   		ribbonModel.Tabs[ti].Groups[gi].Layouts[li].Sections[si].Commands[ci].Size = ribbonModel.Tabs[ti].Groups[gi].Layouts[li].Sections[si].Commands[ci].Size || "Medium";
	                   	}
                        ribbonModel.Tabs[ti].Groups[gi].Layouts[li].Sections[si].Commands[ci].TemplateAlias = ribbonModel.Tabs[ti].Groups[gi].Layouts[li].Sections[si].Commands[ci].TemplateAlias || "o1";
                        ribbonModel.Tabs[ti].Groups[gi].Layouts[li].Sections[si].Commands[ci].ToolTipDescription = ribbonModel.Tabs[ti].Groups[gi].Layouts[li].Sections[si].Commands[ci].ToolTipDescription || "";
                        ribbonModel.Tabs[ti].Groups[gi].Layouts[li].Sections[si].Commands[ci].ToolTipTitle = ribbonModel.Tabs[ti].Groups[gi].Layouts[li].Sections[si].Commands[ci].ToolTipTitle || "";                        
                        ribbonModel.Tabs[ti].Groups[gi].Layouts[li].Sections[si].Commands[ci].EnabledScriptInterval = ribbonModel.Tabs[ti].Groups[gi].Layouts[li].Sections[si].Commands[ci].EnabledScriptInterval || 1000;
                        if(typeof ribbonModel.Tabs[ti].Groups[gi].Layouts[li].Sections[si].Commands[ci].DefaultEnabledStatus === "undefined"){
                            ribbonModel.Tabs[ti].Groups[gi].Layouts[li].Sections[si].Commands[ci].DefaultEnabledStatus = true;
                        }

                        var commandObj = spf.ribbon.getRibbonCommand(ribbonModel.Tabs[ti].Groups[gi].Layouts[li].Sections[si].Commands[ci], sectionObj);
                        ribbonModel.Tabs[ti].Groups[gi].Layouts[li].Sections[si].Commands[ci].Object = commandObj;
                        commandObj.set_enabled(true);
                    } 
                } 
            }               
        }        
    }
    spf.ribbon.selectDefaultTab(ribbonModel);
    setTimeout(function(){
        spf.ribbon.updateDefaultEnableStatuses(ribbonModel);        
    }, 10);
    RefreshCommandUI();
};

spf.ribbon.updateDefaultEnableStatuses = function(ribbonModel){
    ribbonModel.Tabs = ribbonModel.Tabs || [];
    for(var ti = 0, tLen = ribbonModel.Tabs.length; ti < tLen; ti += 1){
        ribbonModel.Tabs[ti].Groups = ribbonModel.Tabs[ti].Groups || [];
        for(var gi = 0, gLen = ribbonModel.Tabs[ti].Groups.length; gi < gLen; gi += 1){
            ribbonModel.Tabs[ti].Groups[gi].Layouts = ribbonModel.Tabs[ti].Groups[gi].Layouts || [];
            for(var li = 0, lLen = ribbonModel.Tabs[ti].Groups[gi].Layouts.length; li < lLen; li += 1){
                ribbonModel.Tabs[ti].Groups[gi].Layouts[li].Sections = ribbonModel.Tabs[ti].Groups[gi].Layouts[li].Sections || [];
                for(var si = 0, sLen = ribbonModel.Tabs[ti].Groups[gi].Layouts[li].Sections.length; si < sLen; si += 1){
                    ribbonModel.Tabs[ti].Groups[gi].Layouts[li].Sections[si].Commands = ribbonModel.Tabs[ti].Groups[gi].Layouts[li].Sections[si].Commands || [];
                    for(var ci = 0, cLen = ribbonModel.Tabs[ti].Groups[gi].Layouts[li].Sections[si].Commands.length; ci < cLen; ci += 1){
                        var DefaultEnabledStatus = ribbonModel.Tabs[ti].Groups[gi].Layouts[li].Sections[si].Commands[ci]["DefaultEnabledStatus"];
                        if(typeof DefaultEnabledStatus === "undefined"){
                            DefaultEnabledStatus = true;
                        }
                        ribbonModel.Tabs[ti].Groups[gi].Layouts[li].Sections[si].Commands[ci].Object.set_enabled(DefaultEnabledStatus);
                    } 
                } 
            }               
        }          
        var elD = ribbonModel.Tabs[ti].Object.$E_2 || ribbonModel.Tabs[ti].Object.$D_2;
        if(elD){
            elD.children[0].onclick = function(){
                spf.ribbon.updateDefaultEnableStatuses(ribbonModel);
            };
        }             
    }    
};

spf.ribbon.selectDefaultTab = function(ribbonModel){
    var defaultTabId = null;
    ribbonModel.Tabs = ribbonModel.Tabs || [];
    for(var ti = 0, tLen = ribbonModel.Tabs.length; ti < tLen; ti += 1){
        if(ribbonModel.Tabs[ti]["Default"] == true){
            defaultTabId = ribbonModel.Tabs[ti]["Id"];
        }
    }    
    if(defaultTabId){
        SelectRibbonTab(defaultTabId, true);
    }
};

spf.ribbon.elementPostRenderAction = function(elementId, callback){
	var getCommandWithDelay = function(elementId, cTries, callback){
    	if(typeof cTries === "undefined"){
    		cTries = 10;
    	}
    	var cEl = document.getElementById(elementId);
    	if(cEl !== null){
    		if(callback && typeof callback === "function"){
    			callback(cEl);
    		}
    	} else {
    		cTries -= 1;
    		if(cTries > 0){
    			setTimeout(function(){
    				getCommandWithDelay(elementId, cTries, callback);
    			}, 100);
    		}
    	}
    };
    getCommandWithDelay(elementId, 10, callback);
};

spf.ribbon.multilineLabelTransformer = function(ctx){
    var cNode = spf.ribbon.getCommandNode(spf.ribbon.ribbonModel, ctx.get_id());
    //var cId = cNode.Id + "-" + cNode.Size;
    var cId = spf.ribbon.getNodeId(cNode);
    spf.ribbon.elementPostRenderAction(cId, function(cEl){
    	var labelText = $(cEl).text();	
    	$(cEl).html(labelText.replace(/\n/g, "<br>"));
    });                               
};

spf.ribbon.htmlLabelTransformer = function(ctx){	
	//console.log(ctx);
    var cNode = spf.ribbon.getCommandNode(spf.ribbon.ribbonModel, ctx.get_id());    
    //var cId = cNode.Id + "-" + cNode.Size;
    var cId = spf.ribbon.getNodeId(cNode);
    spf.ribbon.elementPostRenderAction(cId, function(cEl){
    	var labelText = $(cEl).text();	
    	$(cEl).html(labelText);
    });                       
};

spf.ribbon.hideRibbonElement = function(ctx, elementType){	
	var cNode = spf.ribbon.getCommandNode(spf.ribbon.ribbonModel, ctx.get_id());	
    var parentNode = spf.ribbon.getCommandNodeParent(spf.ribbon.ribbonModel, cNode, elementType);  
    var cId = spf.ribbon.getNodeId(parentNode);
	spf.ribbon.elementPostRenderAction(cId, function(cEl){
    	cEl.style.display = 'none';    
    }); 
};

spf.ribbon.getNodeType = function(node){
    var returnType = "Control";
    returnType = (node.Object instanceof CUI.Tab) ? "Tab" : returnType;
    returnType = (node.Object instanceof CUI.Group) ? "Group" : returnType;
    returnType = (node.Object instanceof CUI.Layout) ? "Layout" : returnType;
    returnType = (node.Object instanceof CUI.Section) ? "Section" : returnType;
    return returnType;   
};

spf.ribbon.getNodeId = function(node){
    var returnType = spf.ribbon.getNodeType(node);  
    var nodeId;
    if(returnType === "Control"){
    	nodeId = node.Id + "-" + node.Size;
    } else {
	    nodeId = node.Id;
    }
    return nodeId;
};

spf.ribbon.getCommandNode = function(ribbonModel, commandId){
	ribbonModel.Tabs = ribbonModel.Tabs || [];
    for(var ti = 0, tLen = ribbonModel.Tabs.length; ti < tLen; ti += 1){
        ribbonModel.Tabs[ti].Groups = ribbonModel.Tabs[ti].Groups || [];
        for(var gi = 0, gLen = ribbonModel.Tabs[ti].Groups.length; gi < gLen; gi += 1){
            ribbonModel.Tabs[ti].Groups[gi].Layouts = ribbonModel.Tabs[ti].Groups[gi].Layouts || [];
            for(var li = 0, lLen = ribbonModel.Tabs[ti].Groups[gi].Layouts.length; li < lLen; li += 1){
                ribbonModel.Tabs[ti].Groups[gi].Layouts[li].Sections = ribbonModel.Tabs[ti].Groups[gi].Layouts[li].Sections || [];
                for(var si = 0, sLen = ribbonModel.Tabs[ti].Groups[gi].Layouts[li].Sections.length; si < sLen; si += 1){
                    ribbonModel.Tabs[ti].Groups[gi].Layouts[li].Sections[si].Commands = ribbonModel.Tabs[ti].Groups[gi].Layouts[li].Sections[si].Commands || [];
                    for(var ci = 0, cLen = ribbonModel.Tabs[ti].Groups[gi].Layouts[li].Sections[si].Commands.length; ci < cLen; ci += 1){
                        if(ribbonModel.Tabs[ti].Groups[gi].Layouts[li].Sections[si].Commands[ci].Id === commandId){
                        	return ribbonModel.Tabs[ti].Groups[gi].Layouts[li].Sections[si].Commands[ci];
                        }
                    } 
                } 
            }               
        }       
    }  
};

spf.ribbon.getCommandNodeParent = function(ribbonModel, commandNode, parentElementType){
	ribbonModel.Tabs = ribbonModel.Tabs || [];
    for(var ti = 0, tLen = ribbonModel.Tabs.length; ti < tLen; ti += 1){
        ribbonModel.Tabs[ti].Groups = ribbonModel.Tabs[ti].Groups || [];
        for(var gi = 0, gLen = ribbonModel.Tabs[ti].Groups.length; gi < gLen; gi += 1){
            ribbonModel.Tabs[ti].Groups[gi].Layouts = ribbonModel.Tabs[ti].Groups[gi].Layouts || [];
            for(var li = 0, lLen = ribbonModel.Tabs[ti].Groups[gi].Layouts.length; li < lLen; li += 1){
                ribbonModel.Tabs[ti].Groups[gi].Layouts[li].Sections = ribbonModel.Tabs[ti].Groups[gi].Layouts[li].Sections || [];
                for(var si = 0, sLen = ribbonModel.Tabs[ti].Groups[gi].Layouts[li].Sections.length; si < sLen; si += 1){
                    ribbonModel.Tabs[ti].Groups[gi].Layouts[li].Sections[si].Commands = ribbonModel.Tabs[ti].Groups[gi].Layouts[li].Sections[si].Commands || [];
                    for(var ci = 0, cLen = ribbonModel.Tabs[ti].Groups[gi].Layouts[li].Sections[si].Commands.length; ci < cLen; ci += 1){
                        if(ribbonModel.Tabs[ti].Groups[gi].Layouts[li].Sections[si].Commands[ci].Id === commandNode.Id){
                        	var returnElement;
                        	switch (parentElementType) {
							   case "Tab":
							      returnElement = ribbonModel.Tabs[ti];
							      break;
							   case "Group":
							      returnElement = ribbonModel.Tabs[ti].Groups[gi];
							      break;
							   case "Layout":
							      returnElement = ribbonModel.Tabs[ti].Groups[gi].Layouts[li];
							      break;
							   case "Section":
							      returnElement = ribbonModel.Tabs[ti].Groups[gi].Layouts[li].Sections[si];
							      break;
							   default:
							      returnElement = ribbonModel.Tabs[ti].Groups[gi].Layouts[li].Sections[si].Commands[ci];
							      break;
							}
                        	return returnElement;
                        }
                    } 
                } 
            }               
        }       
    }  
};


/* 
// Ribbon model exmple

spf.ribbon.ribbonModel = {
    Tabs: [{
        Default: true,
        Title: "Tab 1",             
        Groups: [{
            Title: "Group 1",
            Layouts: [{
                Sections: [{
                    Commands: [{
                        LabelText: 'Button 1',
                        CommandAction: function(ctx){
                            alert(ctx);
                        },
                        InitAction: function(ctx){
                            //console.log(ctx);
                        },
                        InitActions: [function(ctx){}, function(ctx){}],
                        EnabledScript: function(){
                            var ctx = SP.ClientContext.get_current();
							var items = SP.ListOperation.Selection.getSelectedItems(ctx);
                            return items.length === 1 ? true : false;
                        }
                    }, {
                        LabelText: 'Button 2',
                        CommandAction: function(ctx){
                            console.log(ctx);
                        },
                        //DefaultEnabledStatus: false
                        EnabledScript: function(){
                            return false;
                        }
                    }]
                }]
            }]
        }, {
            Title: "Group 2",
            Layouts: [{
                Sections: [{
                    Row: 4,
                    Commands: [{
                        LabelText: 'Button 3'
                    }, {
                        LabelText: 'Button 4'
                    }, {
                        LabelText: 'Button 5'
                    }]
                }]
            }]
        }, {
            Title: "Group 3",
            Layouts: [{
                Sections: [{
                    Row: 4,
                    Commands: [{
                        LabelText: 'Button 6',
                        Size: "Medium",
                        Row: 1,
                        Image16by16: "_layouts/15/1033/images/formatmap16x16.png?rev=40",
                        Image16by16Left: -249,
                        Image16by16Top: -1  
                    }, {
                        LabelText: 'Button 7',
                        Size: "Medium",
                        Row: 2,
                        Image16by16: "_layouts/15/1033/images/formatmap16x16.png?rev=40",
                        Image16by16Left: -249,
                        Image16by16Top: -1  
                    }, {
                        LabelText: 'Button 8',
                        Size: "Medium",
                        Row: 3,
                        Image16by16: "_layouts/15/1033/images/formatmap16x16.png?rev=40",
                        Image16by16Left: -249,
                        Image16by16Top: -1  
                    }]
                }, {
                    Row: 4,
                    Commands: [{
                        LabelText: 'Button 9',
                        Size: "Small",
                        Row: 1,
                        Image16by16: "_layouts/15/1033/images/formatmap16x16.png?rev=40",
                        Image16by16Left: -249,
                        Image16by16Top: -1  
                    }, {
                        LabelText: 'Button 10',
                        Size: "Small",
                        Row: 2,
                        Image16by16: "_layouts/15/1033/images/formatmap16x16.png?rev=40",
                        Image16by16Left: -249,
                        Image16by16Top: -1  
                    }, {
                        LabelText: 'Button 11',
                        Size: "Small",
                        Row: 3,
                        Image16by16: "_layouts/15/1033/images/formatmap16x16.png?rev=40",
                        Image16by16Left: -249,
                        Image16by16Top: -1  
                    }]
                }]
            }]
        }]
    }]
};

spf.ribbon.ribbonReady(function(){
    spf.ribbon.buildRibbon(spf.ribbon.ribbonModel);       
});


*/