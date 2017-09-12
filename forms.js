/**
 * http://usejsdoc.org/
 */

class formfactory{
    

    constructor(model){
	this.model=model;
    }
    
    render(targetnode,type,utask,classid,ido,property,value,label){
	var res;
	switch(type){
	case Constants.IDTO_STRING:
	    
	    res=document.createElement('INPUT');
	    res.setAttribute("type","text");
	    res.setAttribute("name",label);
	    if(value!=null && typeof(value)!="undefined") res.setAttribute("value",value);
	    	    
	case Constants.IDTO_BOOLEAN:
	    
	
	default:
	    if(type>7000){
		//es object property
		
	    }
	
	} 
	if(res!=null){
        	res.setAttribute("utask",utask);
        	res.setAttribute("ido",ido);
        	res.setAttribute("property",property);
	}
	targetnode.appendChild(res);	
    }    
    
    build(idclass,ido,engine){
	var cls=this.model.getClass(idclass);
    }
}

class tableform{
    constructor(model){
	this.model=model;
    }
    
    render(targetnode,utask,classid,ido,property,label){
	var data = [
	    ["", "Ford", "Volvo", "Toyota", "Honda"],
	    ["2016", 10, 11, 12, 13],
	    ["2017", 20, 11, 14, 13],
	    ["2018", 30, 15, 12, 13]
	  ];

	  var hot = new Handsontable(targetnode, {
	    data: data,
	    rowHeaders: true,
	    colHeaders: true,
	    dropdownMenu: true
	  });
    }
}