export default function Modal({tipo,onClose}:{tipo?:string;onClose:()=>void}){return <div role="dialog"><p>Formulário {tipo}</p><button onClick={onClose}>Fechar</button></div>}
