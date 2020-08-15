/**
 * 
 */

class test{
    	constructor(rules,engine, comjs){
    		this.comjs=comjs;
    		this.r=rules;
    	    this.jse=engine;
    	    //this.load_metadata();
    	    	    
    	}
    	init(comjs,handle){
    		 comjs.getXMLfile("xml/ruleengine.xml",handle);   
    	}

	/*load_metadata(){
		var jsonprop=[
			{name:"rdn",id:2,datatype:Constants.IDTO_STRING},
			{name:"base",id:136,datatype:Constants.IDTO_DOUBLE},
			{name:"estado",id:539,objtype:299},			
			{name:"cantidad",id:104,datatype:Constants.IDTO_DOUBLE},	
			{name:"precio",id:141,datatype:Constants.IDTO_DOUBLE},
			{name:"importe",id:150,datatype:Constants.IDTO_DOUBLE},
			{name:"linea",id:477,objtype:112},
			{name:"cliente",id:488,objtype:325},
			{name:"targetClass",id:8,objtype:0},
			{name:"myFunctionalArea",id:11,objtype:4},
		]
		
		var jsonclass=[
			{name:"FACTURA_A_CLIENTE",id:124,props:[2,136,477,150,488,539]},
			{name:"TICKET_VENTA",id:125,props:[2,136,477,150,{id:488,oneof:[533]}]},
			{name:"ESTADO",id:299,oneof:["299.1","299.2"],props:[2]},
			{name:"CLIENTE_VARIOS",id:533,props:[2]},
			{name:"CLIENTE",id:325,props:[2]},
			{name:"LINEA_ARTICULOS",id:112,props:[2,104,141,150]},
			{name:"LINEA_ARTICULOS_MATERIA",id:427,props:[2,104,141,150]},
			{name:"FUNCTIONAL_AREA",id:4,props:[2]},
			{name:"UTASK",id:5,props:[2,11]},
		]

	
        	var jsoninheritance=[	{class:427,super:[112]}, 
        	    			{class:533,super:[325]}, 
        	    			{class:125,super:[124]}// ticket is specialized
													// from factura
        			    ];
        		
        	this.jse.getOntologieMap().load(jsonprop,jsonclass,jsoninheritance);
	}*/
	
	
	load_individual(){
	    
    	var jsonind=[	//{class:299,id:"299.1",rdn:"Planificado"},
    					//{class:299,id:"299.2",rdn:"Programado"},
						{class:533,id:"533.1",rdn:"0",deuda:0,regimen_iva:"12.3"},
						
						// lineas
						// factura
						// menus (UTASK)
						{class:4,id:"4.1",rdn:"Tiendas"},// menu group Tiendas
						{class:4,id:"4.2",rdn:"Ventas"},// menu group Tiendas
						{class:5,id:"5.1",rdn:"Facturas",myFunctionalArea:"4.2",targetClass:125},
						{class:5,id:"5.2",rdn:"nuevo ticket",myFunctionalArea:"4.1",targetClass:125},// here
																										// target
																										// class
																										// range
																										// is
																										// overwritten
																										// to
																										// ticket
						{class:5,id:"5.3",rdn:"Tickets",myFunctionalArea:"4.1",targetClass:125}
					];
    	
    	this.jse.propagate_state(false);
    	
    	this.createLineas(427,jsonind);
    	for(var ind of jsonind){
    	    this.jse.new_individual(ind);
    	}
    	this.jse.propagate_state(true);
    	this.jse.propagate();
    }
	
    createLineas(cls,jsonarr){
		var lineas= new Array();
		for(var pos=1;pos<=1;pos++){
				var idlin=""+cls+"."+pos;
				jsonarr.push({class:427,id:idlin,rdn:idlin,cantidad:2,precio:pos+10});
				
				lineas.push(idlin);
		}
		jsonarr.push({class:124,id:"124.1",rdn:"124.1",base:100,linea:lineas});
		return jsonarr;
    }
}
