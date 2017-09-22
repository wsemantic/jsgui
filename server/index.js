/**
 * 
 */
class context_property{
    constructor(property,is_object_prop=false,path,inverse){
	this.property=property;
	this.is_object_prop;
    }
}

class Filter_key{
    constructor(){
	this.obj_prop_map=new Map();//key=prop name, value=indiv set
	this.obj_prop_map_inverse=new Map();//key=prop name, value=indiv set
	this.data_prop_val=new Map();//key=prop name, value =value array
    }

    set_prop_value(filter_prop,value,inverse){
	if(filter_prop instanceof Filter_Object_Property){
	    let v_arr;
	    if(inverse) v_arr=this.obj_prop_map_inverse.get(filter_prop.property);
	    else v_arr=this.obj_prop_map.get(filter_prop.property);

	    if(v_arr===undefined){
		v_arr=[];
		if(inverse) this.obj_prop_map_inverse.set(filter_prop.property,v_arr);
		else this.obj_prop_map.set(filter_prop.property,v_arr);
	    }
	    v_arr.push(value);
	    return v_arr;
	}

	if(prop instanceof Filter_Data_Property){
	    let v_arr=this.data_prop_val.get(filter_prop.property);

	    if(v_arr===undefined){
		v_arr=[];
		this.data_prop_val.set(filter_prop.property,v_arr);
	    }
	    v_arr.push(value);
	    return v_arr;
	}
    }

    get_key(){
	let key_str="";
	let keys=Array.from( this.obj_prop_map.keys() ).sort();
	for(let key of keys){
	    let data_arr=this.obj_prop_map.get(key);
	    if(key_str.length>0) key_str+="#";
	    key_str+=key+"(";
	    let ini=true;
	    for(ind of data_arr){
		if(!ini) key_str+",";
		key_str+=ind.id;
	    }
	    key_str+=")";       
	}
	keys=Array.from( this.data_prop_val.keys() ).sort();
	for(let key of keys){
	    let data_arr=this.data_prop_val.get(key);
	    if(key_str.length>0) key_str+="#";
	    key_str+=key+"(";
	    let ini=true;
	    for(val of data_arr){
		if(!ini) key_str+",";
		key_str+=val;
	    }
	    key_str+=")";       
	}
	let result=[];
	for(let [key,data_arr] of this.obj_prop_map_inverse){
	    let key_inv="";
	    if(key_str.length>0) key_inv=key_str.substr()+"#";	    
	    key_inv+=key+"(";
	    let ini=true;
	    for(let ind of data_arr){
		if(!ini) key_inv+",";
		key_inv+=ind.id;
	    }
	    key_inv+=")";    
	    result.push(key_inv);
	}

	if(result.length==0 && key_str.length>0) result.push(key_str);//means this.obj_prop_map_inverse is empty
	return result;
    }
    
    get_individual(key_context_result){
	if(key_context_result.includes("#")){
	    key_context_result=key_context_result.split("#")[1];
	}
	let data=key_context_result.split("(");

	let prop=data[0];
	let id=data[1].split(")")[0];
	for(let [key,data_arr] of this.obj_prop_map_inverse){
	    if(key==prop){	
		for(let ind of data_arr){
		    if(ind.id==id) return ind;
		}
	    }
	}
	return null;
    }
}

class Accum_var{
    constructor(var_value){
	this.var_value=var_value;
    }
    get(){
	return this.var_value;
    }
    set(var_value){
	this.var_value=var_value;
    }
}

class Index{
    //Las condiciones que definen el indice tienen un orden recomendado, pero no implica dependencia, en caso de haber dependencia rango o dominio de un contexto es otro indice del que se
    //depende
    constructor(engine,
	    name,
	    class_list,
	    where_obj_prop_list,
	    where_data_prop_list,
	    custom_where_function,
	    key_properties_def){

	//where obj indican otro indice contextual del que se depende, no se define aqui condiciones de filtrado con operadores =, like etc

	//Las filter prop definen que individuos pertenencen a esta clase o subset indexados, equivale al WHERE de una query.
	//las group_properties definen que propiedades identifican al individuo en el algebra de conjuntos (agregacion, duplicados, diferencia)

	this.name=name,
	this.jse=engine;

	this.key_map=new Map();//key en base a propiedades clave obligatorias, y mapea una lista individuos bajo dicha key
	this.listener=new Map();
	this.key_properties_def=key_properties_def;//son nombres de propiedad

	this.class_list=class_list;
	if(where_obj_prop_list==undefined  || where_obj_prop_list==null) this.where_obj_prop_list=[];
	else this.where_obj_prop_list=where_obj_prop_list;
	
	if(where_data_prop_list==undefined || where_data_prop_list==null) this.where_data_prop_list=[];
	else this.where_data_prop_list=where_data_prop_list;


	this.custom_where_function=custom_where_function;
	//TODO los indices deben ser inmutables

	//al crearse individuos en JSE, se registran en log, y mas tarde se chequea su indexacion.
	//POr ejemplo, al cargar una factura, deberia cargarse doc y lineas antes de indexar. Si primero se indexa lineas, ya existen doc y mas tarde al indexar doc tratará de notificar a indices dependientes
	//Quizas en la misma sesion se puede limitar en un unico sentido (procesar los indices dependientes como linea, pero no en doc buscar indices dependientes), eso solo en load, en runtime
	//un cambio de doc puede afectar a lineas ya indexadas
	this.context_map=new Map();//key=context index name, value is array of individual
	//Si una group prop pertenece a un contexto relacionado (de una clase relacionada como parent o child), debe existir un where_obj_prop con el mismo path
	this.group_action=new Map();//key={rule name/key_group_string/key index}, value={contribution value}
	this.group_result=new Map();//key={rule name/key_group_string}, value={group var, group key object}
	this.group_def=new Map();//rule name=>object 
	
	for(let wp of this.where_obj_prop_list){
	    this.jse.Parse_where([wp]);
	    if(wp.domain instanceof Index){
		wp.domain.listener_register(this,wp);
	    }
	    if(wp.range instanceof Index){
		wp.range.listener_register(this,wp);
	    }	   
	}
    }

    listener_register(index,where_prop){
	let data={index:index,where_property:where_prop};
	this.listener.set(index.name,data);	
    }
    
    new_group(rule_name,group_by,action_handle,reverse_handle,consequence_handle,prior){
	this.group_def.set(rule_name,{group_by:group_by,action_handle:action_handle,reverse_handle:reverse_handle,consequence_handle:consequence_handle,priority:prior})
    }


    get_key(individual){    
	return individual.id;
	//TODO soportar key de indices con filter key, y calcularlo en funcion check a la vez que se hace el check
	//TODO poder definir indices reutilizables para gorup y para index (contribuciones). ¿Realmente sirve los indices que no sean de grupo? 
    }

    //context has changed and JSEngine, por cada registro de un cambio en este indice para un individuo, llama a propagate index, que por cada indice relacionado (context) llama a este metodo 
    context_changed_handler(contextindex,where_prop,context_individual,existence){
	//el parametro contextindex seria this en el indice que llama
	// context_individual es un individuo indexado desde el indice externo context
	var lista_end;
	//getrange y getDomain debe chequear que dominio y rango son compatibles con clase del individuo
	if(where_prop.inverse){
	    lista_end=this.jse.getRange(context_individual,where_prop.property);
	}else{
	    lista_end=this.jse.getInverseDomain(context_individual,where_prop.property);            
	}
	if(!existence){
	    for(let ind of lista_end){
		if(this.is_indexed(ind)){
		    //TODO quizas pueda existir otro context_individual que habilite este individuo the this
		    remove_index(ind);
		}
	    }
	}else{
	    //si existence (acaba de indexarse), busco de acuerdo a la condicion de cumplimiento de this index, si el resto se satisfacen

	    for(let ind of lista_end){
		if(!this.is_indexed(ind) && this.check(ind,[{index:contextindex,where_property:where_prop}])){
		    //chequea la pertenencia al indice excepto esta condicion que ya cumpple, y en su caso lo suscribe
		    this.index_new_object(ind);
		    this.jse.log_property_change_byindex(this.name,ind,null/*prop nulo porque registro nueva indexacion*/,"new");
		}
	    }
	}
    }

    check(individual, excluding_context_arr){
	let class_compatible=false;
	let group_key_map=new Map();
	let index_key_map=new Map();
	
	for(let cls of this.class_list){
	    if(this.jse.is_specialized_of(individual.class,cls)){
		class_compatible=true;
		break;
	    }
	}
	if(class_compatible){
	    //where es un filtrado, no una agrupacion
	    for(let fprop of this.where_obj_prop_list){
		if(fprop.included_in(excluding_context_arr)) continue;
		//Este individuo siendo de clase compatible, y aunque admita por modelo relacionarse para esta object prop, quizas en la practica no tiene ninguna relacion de ese tipo y no cumple
		if(!this.check_where_obj_prop(individual,fprop)){
		    class_compatible=false;
		    break;
		}
	    }
	    if(class_compatible){
		for(let dprop of this.where_data_prop_list){
		    if(!this.check_where_data_prop_list(individual,dprop)){
			class_compatible=false;
			break;
		    }
		}
	    }
	    //TODO check custom filter
	}

	let reverse=false;
	let is_indexed=this.is_indexed(individual);
	if(class_compatible){
	    if(!is_indexed){
		this.index_new_object(individual);
	    }
	}else{
	    if(is_indexed){
		reverse=true;
		//TODO remove and log
	    }
	}
	if(class_compatible || reverse){
	    this.group_execution(individual,group_key_map);
	}
	return class_compatible;
    }
    
    group_execution(individual,group_key_map){	
	this.process_group(individual,group_key_map);
	//group_key_map key=rule name
	for(let [key_rule,group_key] of group_key_map){
	    //key_arr: a key for each inverse/root context
	    let key_arr=group_key.get_key();
	    let data=this.group_def.get(key_rule);
	    for(let key_context of key_arr){
		//consequence_handle
		let contrib_key=key_rule+"#"+key_context+"#"+individual.id;//for each context root can be a contribution, for example same line of diferent document
		let result_key=key_rule+"#"+key_context;//for each context root can be a contribution, for example same line of diferent document
		let contribution=this.group_action.get(contrib_key);
		let result_data=this.group_result.get(result_key);
		if(result_data==undefined || result_data==null){
		    result_data={group_var:new Accum_var(),group_key:group_key,key_context_result:result_key};
		    this.group_result.set(result_key,result_data);
		}
		if(contribution!=undefined && contribution!=null){
		    data.reverse_handle(result_data.group_var,contribution);
		}
		    
		contribution=data.action_handle(result_data.group_var,individual);
		if(contribution!=undefined){
		    //¿que pasa si es undefined porque faltan datos, o tomar lo que falta como cero, debo registrar log?
		    this.group_action.set(contrib_key,contribution);
		    this.jse.Log_accumulation(key_rule,result_key,data.priority);
		}
	    }
	}
    }
    
    Group_consequence(rule_name,key_context_result){
	let gr_def=this.group_def.get(rule_name);
	if(gr_def!=undefined){
	    let data=this.group_result.get(key_context_result);
	    if(data!=undefined){
		gr_def.consequence_handle(data.group_var,data.group_key,key_context_result);
	    }
	}
    }
    
    process_group(this_individual,group_key_map){
	for(let [key_rule,def] of this.group_def){
	    let group_by=def.group_by;
	    let group_key=group_key_map.get(key_rule);
	    if(group_key===undefined){
		group_key=new Filter_key();
		group_key_map.set(key_rule,group_key);
	    }

	    for(let prop_where of group_by){
		let indiv_set=this.get_where_obj_prop_context(this_individual,prop_where);
		for(let ind of indiv_set){  
		    group_key.set_prop_value(prop_where,ind,prop_where.inverse);
		}
	    }
	}
    }

    //focus on this index, get external context individual set
    get_where_obj_prop_context(this_individual,where_obj_prop){
	let ind_arr;//conjunto de potenciales a ver si cumple requisito de filtrado
	let end_set_class;//requisito de clase o set al que debe pertenecer (que segun sea inversa o no se correspondera a uno u otro extremo)
	let end_set_result=[];

	if(where_obj_prop.inverse){
	    //puede ser que este individuo no cumpla el requisito, por ejemplo una linea en un indice de flujo de stock, debe estar asoaciada a un doc de movimiento
	    ind_arr=this.jse.getInverseDomain(this_individual,where_obj_prop.property);
	    end_set_class=where_obj_prop.domain;//es un indice o una clase
	}else{
	    if(jse.is_specialized_of(where_obj_prop.range,jse.get_range_class(where_obj_prop.property))){
		ind_arr=this.jse.getRange(this_individual,where_obj_prop.property);
		end_set_class=where_obj_prop.range;
	    }
	}

	if(ind_arr !== undefined){
	    for(let ind of ind_arr){    
		if(this.is_class_of(ind,end_set_class)){
		    end_set_result.push(ind);
		    this.context_map.set(end_set_class.name,ind);
		}
	    }
	}
	return end_set_result;
    }

    //Filter obj prop puede tener un extremo contexto que es dominio o rango un indice o clase o individuo, 
    //y ser inversa o no (inversa siginifica que el individuo de referencia es el rango o el dominio, y el otro extremos es el contexto) 
    check_where_obj_prop(individual,where_obj_prop){
	let end_set= this.get_where_obj_prop_context(individual,where_obj_prop);
	//quitar this.process_group(group_key_map,end_set,where_obj_prop.property,where_obj_prop.inverse);
	return end_set.length>0;
    }

    check_where_data_prop_list(individual,where_data_prop){
	var value=this.jse.getPropertyValue(individual,where_data_prop.property);
	if(value == undefined || value==null) return false;

	return (value===where_data_prop.value);
    }

    is_class_of(dom_ind,class_of_set){
	if(class_of_set instanceof Index){
	    if(class_of_set.is_indexed(dom_ind)) return true;
	}else if(class_of_set instanceof Individual){
	    if(class_of_set===dom_ind) return true;
	}else if(jse.is_specialized_of(dom_ind,class_of_set)){
	    return true;    
	}
	return false;
    }

    is_indexed(individual){
	let key=this.get_key(individual);
	if(this.key_map.has(key)){
	    let i=this.key_map.get(key);
	    return i!=undefined && i!=null && i.id==individual.id;
	}else return false;
    }
    
    index_new_object(individual){
	let key=this.get_key(individual);
	this.key_map.set(key,individual);
	this.jse.Log_index(this,individual,true);
    }

    remove_index(individual){
	delete this.indexed_arr[indexed_arr.indexOf(individual)];
	jse.log_index(this,individual,false);
    }

    //JSEngine, por cada registro de un cambio en este indice para un individuo llama a los indices contexto con los que se relaciona este indice
    propagate_index(individual,existence){
	for(let [index_name,data] of this.listener){	    
	    //ojo, llama al context_update_handler de indices externos, no the this
	    data.index.context_changed_handler(this,data.where_property,individual,existence);
	}
    }
    


    /*funcion que procesa cambios y llama a listener de indices en cascada   

    ante un cambio de indexado, debo notificar a indices listener, y a reglas
    Si cargo muchos individuos ¿debo retrasar notificar a otros indices hasta que acabe la carga? Si cargo primero las lineas y despues los doc, cuando procese las lineas si tendra todos los datos
    indices listener son prioritarios para que las reglas razonen con todo los datos

    ¿Como se retrasa notificar a otro indices, como un run? Quizas solo se retrasa en metodo load, que inhabilite las notificaciones. 
    Tambien una regla podria deshabilitar si esta construyendo objetos
    O quizas cuando acaban de dispararse todas las reglas, se actualizan los indices, y otra vez reglas con prioridad
    O al acabar una regla, se actualizan indices, y despues resto reglas, es decir el nucleo es el que decide cuando llamar actualizaciones
     */
}