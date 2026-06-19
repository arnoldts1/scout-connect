import React, { forwardRef } from 'react';

const BG_IMAGE = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/692c62c0194d7c49d30102e3/ad471ff60_Bg1.png";
const LOGO_IMAGE = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/692c62c0194d7c49d30102e3/f176dd477_rsaLOGO.jpg";

const ICYICIRO_MAP = {
  inkesha: 'Inkesha',
  ingenzi: 'Ingenzi',
  abahizi: 'Abahizi',
  abatoni: 'Abatoni'
};

// Card rendered at 323px × 204px (85.6mm × 53.98mm at 96dpi)
const ScoutCardPreview = forwardRef(function ScoutCardPreview({ scout, signatureUrl }, ref) {
  const icyiciro = ICYICIRO_MAP[scout.icyiciro] || scout.icyiciro || '—';

  return (
    <div
      ref={ref}
      style={{
        width: '323px',
        height: '204px',
        position: 'relative',
        backgroundImage: `url("${BG_IMAGE}")`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        borderRadius: '10px',
        border: '2px solid black',
        fontFamily: 'Arial, Helvetica, sans-serif',
        overflow: 'hidden',
        flexShrink: 0
      }}>

      {/* Signature background */}
      {signatureUrl &&
      <img
        src={signatureUrl}
        alt="signature"
        style={{
          position: 'absolute',
          bottom: '6px',
          right: '8px',
          height: '28px',
          opacity: 0.7,
          objectFit: 'contain'
        }} className="mr-4 mb-5" />

      }

      {/* Header */}
      <div style={{ position: 'absolute', top: '10px', left: '10px', display: 'flex', alignItems: 'center' }} className="">
        <img
          src={LOGO_IMAGE}
          alt="RSA Logo"
          style={{ width: '22px', height: '22px', borderRadius: '11px', border: '1px solid #132b42', marginRight: '6px' }} className="mx-6" />

        <span style={{ fontSize: '9px', fontWeight: 600, color: '#1c3f5f' }} className="my-6 px-1 py-2 text-lg font-black text-center uppercase">RWANDA SCOUT ASSOCIATION</span>
      </div>

      {/* Photo */}
      <div style={{
        position: 'absolute',
        top: '38px',
        left: '12px',
        width: '72px',
        height: '84px',
        borderRadius: '10px',
        overflow: 'hidden',
        border: '1.5px solid #1c3f5f',
        background: '#ddd'
      }} className="mx-8 my-8">
        {scout.avatar ?
        <img src={scout.avatar} alt="Scout" style={{ width: '100%', height: '100%', objectFit: 'cover' }} className="rounded-none" /> :

        <div style={{ width: '100%', height: '100%', background: '#b0c4d8', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1c3f5f', fontSize: '10px' }}>
            No Photo
          </div>
        }
      </div>

      {/* Badge */}
      <div style={{
        position: 'absolute',
        top: '42px',
        right: '8px',
        background: '#1f6f78',
        color: 'white',
        padding: '4px 10px',
        fontSize: '7.5px',
        fontWeight: 'bold',
        borderRadius: '8px'
      }}>
        IKARITA Y'UMU SCOUT
      </div>

      {/* Details */}
      <div style={{ position: 'absolute', top: '68px', left: '95px', fontSize: '7.5px', color: '#244c6a', lineHeight: '12px' }}>
        <table style={{ borderCollapse: 'collapse' }}>
          <tbody>
            <tr>
              <td style={{ fontWeight: 'bold', paddingRight: '4px', whiteSpace: 'nowrap' }} className="px-10">Name</td>
              <td>: {scout.full_name || '—'}</td>
            </tr>
            <tr>
              <td style={{ fontWeight: 'bold', paddingRight: '4px', whiteSpace: 'nowrap' }} className="px-10">Scout ID</td>
              <td>: {scout.scout_id || '—'}</td>
            </tr>
            <tr>
              <td style={{ fontWeight: 'bold', paddingRight: '4px', whiteSpace: 'nowrap' }} className="px-10">D.O.B</td>
              <td>: {scout.dob || '—'}</td>
            </tr>
            <tr>
              <td style={{ fontWeight: 'bold', paddingRight: '4px', whiteSpace: 'nowrap' }} className="px-10">Address</td>
              <td>: {scout.location || '—'}</td>
            </tr>
            <tr>
              <td style={{ fontWeight: 'bold', paddingRight: '4px', whiteSpace: 'nowrap' }} className="px-10">Icyiciro</td>
              <td>: {icyiciro}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>);

});

export default ScoutCardPreview;
export { ICYICIRO_MAP };