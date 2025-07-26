import React from 'react';

const DamnificadoForm = ({ damnificado, idx, onChange, onRemove, showRemove, errors }) => (
  <div className="border rounded p-2 mb-2 bg-light">
    <div className="row mb-2">
      <div className="col">
        <label className="text-black form-label" htmlFor={`nombre-${idx}`}>Nombre *</label>
        <input type="text" className={`form-control${errors?.nombre ? ' is-invalid' : ''}`} id="nombre" value={damnificado.nombre} onChange={e => onChange(idx, e)} aria-describedby={`error-nombre-${idx}`}/>
        {errors?.nombre && <div className="invalid-feedback" id={`error-nombre-${idx}`}>{errors.nombre}</div>}
      </div>
      <div className="col">
        <label className="text-black form-label" htmlFor={`apellido-${idx}`}>Apellido *</label>
        <input type="text" className={`form-control${errors?.apellido ? ' is-invalid' : ''}`} id="apellido" value={damnificado.apellido} onChange={e => onChange(idx, e)} aria-describedby={`error-apellido-${idx}`}/>
        {errors?.apellido && <div className="invalid-feedback" id={`error-apellido-${idx}`}>{errors.apellido}</div>}
      </div>
    </div>
    <div className="row mb-2">
      <div className="col">
        <label className="text-black form-label" htmlFor={`domicilio-${idx}`}>Domicilio</label>
        <input type="text" className="form-control" id="domicilio" value={damnificado.domicilio} onChange={e => onChange(idx, e)} />
      </div>
      <div className="col">
        <label className="text-black form-label" htmlFor={`telefono-${idx}`}>Teléfono</label>
        <input type="tel" className="form-control" id="telefono" value={damnificado.telefono} onChange={e => onChange(idx, e)} />
      </div>
      <div className="col">
        <label className="text-black form-label" htmlFor={`dni-${idx}`}>DNI</label>
        <input type="text" className="form-control" id="dni" value={damnificado.dni} onChange={e => onChange(idx, e)} />
      </div>
    </div>
    <div className="mb-2 form-check">
      <input type="checkbox" className="form-check-input" id="fallecio" checked={damnificado.fallecio || false} onChange={e => onChange(idx, e)} />
      <label className="text-black form-check-label" htmlFor={`fallecio-${idx}`}>¿Falleció?</label>
    </div>
    {showRemove && (
      <button type="button" className="btn btn-outline-danger btn-sm" onClick={() => onRemove(idx)}>
        Eliminar damnificado
      </button>
    )}
  </div>
);

export default React.memo(DamnificadoForm); 