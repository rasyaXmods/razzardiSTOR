import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function Home() {
  const products = await db.product.findMany({ where: { active: true }, orderBy: { name: "asc" }, take: 24 });
  return <main style={{minHeight:"100vh",background:"#030b18",color:"#edf5ff",fontFamily:"Arial,sans-serif",padding:"28px",maxWidth:1200,margin:"auto"}}>
    <header style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:16,flexWrap:"wrap",borderBottom:"1px solid #16304c",paddingBottom:20}}>
      <div style={{fontSize:24,fontWeight:900,color:"#18bfff"}}>RAZZARDISTORE <small style={{display:"block",fontSize:10,color:"#8ba8c7",letterSpacing:2}}>TOP UP GAME • CEPAT • AMAN</small></div>
      <nav style={{display:"flex",gap:20,fontSize:14}}><a href="#games">Top Up</a><a href="/cek-pesanan">Cek Pesanan</a><a href="#payment">Pembayaran</a></nav>
    </header>
    <section style={{padding:"60px 0 48px",maxWidth:720}}>
      <p style={{color:"#20c8ff",fontWeight:700}}>TOP UP GAME ONLINE</p>
      <h1 style={{fontSize:"clamp(36px,6vw,64px)",lineHeight:1.02,margin:"12px 0"}}>Murah, Cepat, Aman & <span style={{color:"#18bfff"}}>Terpercaya!</span></h1>
      <p style={{color:"#a8bdd5",lineHeight:1.7}}>Pilih game, masukkan ID pemain, pilih nominal, lalu selesaikan pembayaran melalui penyedia pembayaran resmi.</p>
      <a href="#games" style={{display:"inline-block",background:"#087cf0",padding:"14px 22px",borderRadius:10,color:"white",fontWeight:700,textDecoration:"none",marginTop:12}}>Mulai Top Up →</a>
    </section>
    <section id="games">
      <h2>Produk tersedia</h2>
      {products.length === 0 ? <p style={{color:"#a8bdd5"}}>Produk belum dikonfigurasi admin. Tambahkan SKU dan harga yang telah diverifikasi di dashboard admin API sebelum menerima pesanan.</p> :
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(190px,1fr))",gap:14}}>
        {products.map(p=><article key={p.id} style={{background:"#081a30",border:"1px solid #173958",padding:18,borderRadius:14}}>
          <small style={{color:"#18bfff"}}>{p.category}</small><h3>{p.name}</h3><p>Rp {p.price.toLocaleString("id-ID")}</p><p style={{color:"#8ba8c7",fontSize:12}}>SKU provider: {p.providerSku}</p>
        </article>)}
      </div>}
    </section>
    <section id="payment" style={{marginTop:36,padding:22,border:"1px solid #173958",borderRadius:14,background:"#07172a"}}>
      <h2>Metode Pembayaran</h2><p style={{color:"#a8bdd5"}}>Metode yang tampil saat checkout mengikuti konfigurasi aktif pada akun Midtrans Anda.</p>
      <p>Transfer bank • E-wallet • QRIS • Metode lain yang didukung Midtrans</p>
    </section>
    <footer style={{marginTop:40,borderTop:"1px solid #17304a",paddingTop:20,color:"#8ba8c7",fontSize:12}}>© {new Date().getFullYear()} RAZZARDISTORE. Status pembayaran dan pemenuhan pesanan harus diverifikasi melalui webhook resmi.</footer>
  </main>;
}
