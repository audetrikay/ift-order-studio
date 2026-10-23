export const SUPPLIERS = [
 {id:'123roulement',name:'123 Roulement',domain:'123roulement.com'},
 {id:'rs',name:'RS Components',domain:'fr.rs-online.com'},
 {id:'manomano',name:'ManoMano',domain:'manomano.fr'},
 {id:'amazon',name:'Amazon',domain:'amazon.fr'},
 {id:'other',name:'Autre fournisseur',domain:''},
];
export const PROJECTS = ['Aquaponics','Crystal Mouse','Gosai','Haptic Glove','Inflatable Smartwing','Materove','Octon','Swarm Drones','Ghost Hatch','Ocean Imprints','Other'];
export const STATUSES = ['pending','approved','rejected','ordered','received'];
export const STATUS_LABELS = {pending:'En attente',approved:'Approuvée',rejected:'Refusée',ordered:'Commandée',received:'Reçue'};
export const money = n => new Intl.NumberFormat('fr-FR',{style:'currency',currency:'EUR'}).format(Number(n)||0);
export const dateText = timestamp => timestamp?.toDate ? timestamp.toDate().toLocaleDateString('fr-FR') : '—';
export const isValidSupplierUrl = (value,supplier) => {
 if(!value) return false;
 try {const u=new URL(value);if(!['https:','http:'].includes(u.protocol)) return false;
 return !supplier?.domain || u.hostname===supplier.domain || u.hostname.endsWith('.'+supplier.domain);
 } catch{return false;}
};
