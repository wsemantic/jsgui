class rules{
    

	constructor(engine){
	    this.jse=engine;
	}
	
	index_build(){
	    //OJO Si una linea deja de estar asociada al root definido
	    this.jse.new_index(
		    "documento flujo stock",
		    ["FLUJO_ARTICULOS","REGULARIZACION","PRODUCCION"],
		    null,//where data prop
		    null,
		    doc=>{
			return !(doc.clase("PRODUCCION") && !doc.estado.matches("Programado|Realizado"));
		    }
	    );	    
	    //TODO poder configurar una funcion flag para indexar diferente origen que destino, resto es lo mismo. 
	    //Lo mismo con despiece

	    //OJO Si una linea deja de estar asociada al root definido
	    this.jse.new_index(
		    "documento comercial",
		    ["FACTURA_A_CLIENTE"],
		    null,//where data prop
		    null,
		    null
	    );	

	    this.jse.new_index(
		    "linea flujo stock",
		    ["LINEA_MATERIA"],
		    [new Filter_Object_Property("documento flujo stock","linea")],
		    null,//where data prop
		    doc=>{
			if(	linea.producto.requiere_lote && linea.lote==null ||
				linea.producto.requiere_talla && linea.talla==null||
				linea.producto.requiere_color && linea.color==null||
				linea.producto.requiere_medida && (linea.medida1==null||linea.medida2==null)||
				linea.producto.requiere_calidad && linea.calidad==null)
			    return false;

			return true;
		    }
		    //porque en drools no tiro de clave, porque puede cambiar su valor al estar siendo creado el detalle y dejar stock basura?
	    );
	    
	   // this.jse.new_index( "stock",
		//   "STOCK",
		 //  ["clave_producto","almacen_stock"]);
	    this.jse.new_index(
		    "linea articulos",
		    ["LINEA_ARTICULOS"],
		    [new Filter_Object_Property("documento comercial","linea")],
		    null,//where data prop
		    null,
		    ["clave_producto"]
	    );//si no tiene clave se indexa cada individuo
	    
	    //TODO indice de precio dependiente de cliente y de tarifas de producto, y ¿de condiciones especiales?
	}
	
	importe_linea(){
	    this.jse.add_listener_to_index("importe_linea","linea articulos",100,["precio","cantidad"],linea=>{
		this.jse.set(linea,"importe",linea.precio*linea.cantidad);
	    });
	    //Se registra para ese indice, propiedades sensibles y handler asociado, si una cambia, se llama el handler. Asi no seria necesario la gestion de activaciones.
	    
	    //Entonces una clase registra para cada regla e indice, el handler asociado
	}
	
	base_total_documento(){
	    //funcion group indica propiedades o indices contexto por que agrupar y como se relaciona
	    //Action/aggregate function debe recibir una variable por cada key de agrupacion
	    this.jse.new_group(
		    "base total documento",//nombre de regla
		    "linea articulos",//indice
		    [new Filter_Object_Property("documento comercial","linea",null,true)],//group by
		    //funcion action. Debe soportar incrementos y reverse, se llama en el momento
		    (group_var,linea,group_key,index_key)=>{		
			//TODO simplificar return nuevo valor y valor de contribucion o reverse param
			let contribut=linea.importe;
			if(contribut==undefined) contribut=0;
			let i=group_var.get();
			if(i===undefined) i=0;
			group_var.set(i+contribut);
			return contribut;
		    },
		    //funcion reverse
		    //TODO probar que funciona cuando deja de correlar un individuo
		    (group_var,contribution)=>{		
			if(contribution==undefined) contribution=0;
			group_var.set(group_var.get()-contribution);
		    },
		    //consequence function. Debe llamarse de acuerdo a la prioridad
		    (group_var,group_key,key_context_result)=>{
			let doc;
			doc=group_key.get_individual(key_context_result);
			this.jse.set(doc,"importe",group_var.get());
		    },
		    0//prioridad
		    );
	}
	/*
	 agregar_lineas(){
	    //se entiende el contexto (documento) tambien es clave del indice
	    //El indice podria estar predefinido, o lo definimos en linea {propiedades clave}, la propiedad perfil son todas las object prop por defecto y contexto (relaciones entrantes)
	    //No necesito ser sensible a cambios porque no se puede deshacer. Debe disparase por cada incremento del indice
	    duplicados("agregar_lineas","DOCUMENTO.LINEA{perfil,clave_producto,precio,descuento,concepto,fecha_estimada_entrega,coste}",
		//se va a disparar por cada ID del indice. O bien al inicializarse o al incrementarse. No es encesario aqui un reverse
		(lista,id)=>{
		    var duplicados=lista.get(id);
		    var lin1,lin2;
		    for(linea of duplicados){
			if(lin1==null) lin1=linea;
			else{
			    lin2=linea;
			    engine.set(lin1,"cantidad",lin1.cantidad+lin2.cantidad);
			    lin2=null;
			}
		    }
	    	}
	    );
	}	
	
	instalar_stocks(){
	    difference( rule="instalar_stocks",
		    	indexL="flujo stock",
		    	indexR="stock",
		    	//no necesita key adicional
        		(id,linea)=>{
        		    //crea individuo stock con datos de linea y documento
        			//    for(documentos de linea){
        			//	if(documento tiene almacen) almacen=..
        			//	...
        			//}	
        		 }
		  )
	}
	
	stock_update(){
	    accumulate(	rule="stock_update",
		    	priority=5,
		    	index="flujo stock",
		    	action=idto,id,index,linea,existencia=>{
		    	    var acumvar=getacumvar("stock_update",id);
		    	    var signo=existencia?1:(-1);
		    	    if(id.getIndex("almacen").contains("origen")) signo=signo*(-1);
		    	    acumvar+=signo*linea.cantidad;		    	    
		    	},
		    	result=(id)=>{
		    	    var acumvar=getacumvar("stock_update",id);
		    	    var stock=index.get("STOCK",id);
		    	    engine.set(stock,"cantidad",acumvar);
		    	}
	    )	
	}
	*/
}