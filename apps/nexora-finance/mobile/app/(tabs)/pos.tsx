import { useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';

type CartItem = { id: string; name: string; price: number; qty: number };
const initialCart: CartItem[] = [{id:'1',name:'Nexora Ledger Journal Pro',price:185000,qty:2},{id:'2',name:'Premium ERP Blueprint Card',price:95000,qty:1}];

export default function PosTab() {
  const [cart] = useState(initialCart);
  const total = useMemo(() => cart.reduce((sum,item)=>sum + item.price * item.qty,0), [cart]);
  const checkout = () => Alert.alert('Checkout Sukses', `Transaksi Rp ${total.toLocaleString('id-ID')} berhasil diproses ke General Ledger.`);
  return <ScrollView style={styles.container} contentContainerStyle={styles.content}>
    <View style={styles.topRow}><Text style={styles.heading}>Active Cashier Register</Text><TouchableOpacity style={styles.scanBtn} onPress={()=>router.push('/modal')}><Text style={styles.scanText}>Scan Barcode</Text></TouchableOpacity></View>
    <View style={styles.cart}>{cart.map(item=><View key={item.id} style={styles.item}><View style={{flex:1}}><Text style={styles.name}>{item.name}</Text><Text style={styles.price}>Rp {item.price.toLocaleString('id-ID')} × {item.qty}</Text></View><Text style={styles.itemTotal}>Rp {(item.price*item.qty).toLocaleString('id-ID')}</Text></View>)}</View>
    <View style={styles.summary}><View style={styles.totalRow}><Text style={styles.totalLabel}>Total Pembayaran</Text><Text style={styles.totalValue}>Rp {total.toLocaleString('id-ID')}</Text></View><TouchableOpacity style={styles.pay} onPress={checkout}><Text style={styles.payText}>Proses Pembayaran (QRIS / Cash / Card)</Text></TouchableOpacity></View>
  </ScrollView>;
}
const styles=StyleSheet.create({container:{flex:1,backgroundColor:'#020617'},content:{padding:20},topRow:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginBottom:16},heading:{fontSize:16,fontWeight:'bold',color:'#f8fafc'},scanBtn:{backgroundColor:'#1e293b',paddingHorizontal:12,paddingVertical:6,borderRadius:10,borderWidth:1,borderColor:'#334155'},scanText:{color:'#38bdf8',fontWeight:'bold',fontSize:12},cart:{backgroundColor:'#0f172a',borderRadius:16,padding:16,borderWidth:1,borderColor:'#1e293b',marginBottom:16},item:{flexDirection:'row',paddingVertical:12,borderBottomWidth:1,borderBottomColor:'#1e293b'},name:{color:'#fff',fontSize:13,fontWeight:'600'},price:{color:'#94a3b8',fontSize:11,marginTop:3},itemTotal:{color:'#38bdf8',fontWeight:'bold',fontSize:12},summary:{backgroundColor:'#0f172a',borderRadius:16,padding:16,borderWidth:1,borderColor:'#1e293b'},totalRow:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginBottom:16},totalLabel:{color:'#cbd5e1',fontSize:13},totalValue:{color:'#fff',fontSize:18,fontWeight:'900'},pay:{backgroundColor:'#4f46e5',padding:14,borderRadius:12,alignItems:'center'},payText:{color:'#fff',fontWeight:'bold',fontSize:12}}
);
