import { useState } from 'react';

export default function LoginDebug() {
  const [email, setEmail] = useState('');
  return (
    <div style={{minHeight:'100vh', display:'grid', placeItems:'center'}}>
      <div style={{border:'1px solid #ddd', borderRadius:8, padding:24, width:360}}>
        <h1>Login DEBUG</h1>
        <p style={{color:'#666'}}>Esta página no usa alias ni contexto, solo prueba de render.</p>
        <label style={{display:'block', marginTop:12}}>Email</label>
        <input
          style={{width:'100%', padding:8, border:'1px solid #ccc', borderRadius:6}}
          value={email}
          onChange={(e)=>setEmail(e.target.value)}
          placeholder="tu@correo.com"
        />
      </div>
    </div>
  );
}
