
class domsinc extends storeListener{
    

    constructor(document){
    	super();
    	this.doc=document;
    }
    
    set(idcls,id,propname,value){
		var node = this.doc.getElementById(id); 
		if(node!=undefined && node!=null){
			node.innerHTML=node.innerHTML+" class:"+idcls+" "+propname+": "+value;
		}
		
		var root = this.doc.getElementById("root");                 
		var node = this.doc.createElement("LI");
		node.setAttribute("id",id);
		var textnode = this.doc.createTextNode("set object notification "+id+" prop:"+propname+" val:"+value);  
		node.style.color="gray"; 
		node.style.fontSize="small";
		node.appendChild(textnode);   
		root.appendChild(node);     
    }
    
    addvalue(id,propname,value){
		var node = this.doc.getElementById(id);                 	
		node.innerHTML=node.innerHTML+" "+propname+": "+value;      
	}
    
    new_individual(idclass,id){
		/*var root = this.doc.getElementById("root");                 
		var node = this.doc.createElement("LI");
		node.setAttribute("id",id);
		var textnode = this.doc.createTextNode("new object notification "+idclass+" id:"+id);  
		node.style.color="gray"; 
		node.style.fontSize="small";
		node.appendChild(textnode);   
		root.appendChild(node);    */ 
    }
    
    delvalue(id,propname,value){}
    
    delobject(idclass,id){}
}