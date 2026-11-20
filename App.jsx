import { useState, useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://jyigungffdpqdgknhqao.supabase.co",
  "sb_publishable_Am7kFgOwqUw6BWWwElm0pw_0nS_wzHP"
);

const API_URL = "https://leadflow-api-production-d2f0.up.railway.app";

const BUSINESS_KEYWORDS = {
  "Supermarket": ["supermarket","grocery store","food market"],
  "Pharmacy": ["pharmacy","chemist","drug store"],
  "Hotel": ["hotel","guest house","lodge"],
  "Restaurant": ["restaurant","eatery","food canteen"],
  "Hospital": ["hospital","medical centre","clinic"],
  "School": ["school","academy","college"],
  "Logistics": ["logistics company","courier service","transport company"],
  "Filling Station": ["filling station","petrol station","fuel station"],
  "Hardware Store": ["hardware store","building materials","ironmonger"],
  "Fashion Shop": ["fashion shop","boutique","clothing store"],
  "Electronics Store": ["electronics store","phone shop","computer shop"],
  "Church": ["church","ministry","evangelical church"],
  "Mosque": ["mosque","islamic centre","masjid"],
  "Market": ["market","trade centre","shopping complex"],
  "Salon": ["salon","barber shop","hair stylist"],
  "Bakery": ["bakery","bread shop","confectionery"],
  "Printing Press": ["printing press","print shop","signage company"],
  "Clinic": ["clinic","medical centre","health centre"],
};

const NIGERIAN_STATES = [
  "Abia","Adamawa","Akwa Ibom","Anambra","Bauchi","Bayelsa","Benue","Borno",
  "Cross River","Delta","Ebonyi","Edo","Ekiti","Enugu","FCT Abuja","Gombe",
  "Imo","Jigawa","Kaduna","Kano","Katsina","Kebbi","Kogi","Kwara","Lagos",
  "Nasarawa","Niger","Ogun","Ondo","Osun","Oyo","Plateau","Rivers","Sokoto",
  "Taraba","Yobe","Zamfara"
];

const BUSINESS_TYPES = Object.keys(BUSINESS_KEYWORDS);

const DATE_OPTIONS = [
  { label: "All time", value: "" },
  { label: "Today", value: "today" },
  { label: "This week", value: "week" },
  { label: "This month", value: "month" },
  { label: "Last month", value: "last_month" },
  { label: "Last 3 months", value: "3months" },
];

function getDateRange(value) {
  const now = new Date();
  const today = now.toISOString().split("T")[0];
  if (!value) return { from: "", to: "" };
  if (value === "today") return { from: today, to: today };
  if (value === "week") {
    const d = new Date(now); d.setDate(d.getDate() - 7);
    return { from: d.toISOString().split("T")[0], to: today };
  }
  if (value === "month") {
    return { from: `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}-01`, to: today };
  }
  if (value === "last_month") {
    const d = new Date(now.getFullYear(), now.getMonth()-1, 1);
    const e = new Date(now.getFullYear(), now.getMonth(), 0);
    return { from: d.toISOString().split("T")[0], to: e.toISOString().split("T")[0] };
  }
  if (value === "3months") {
    const d = new Date(now); d.setMonth(d.getMonth()-3);
    return { from: d.toISOString().split("T")[0], to: today };
  }
  return { from: "", to: "" };
}

function statusColor(s) {
  if (s === "Converted")        return "#B58C91";
  if (s === "Pending Approval") return "#9B4A58";
  if (s === "Contacted")        return "#C8BFB0";
  if (s === "In Progress")      return "#a78bfa";
  if (s === "Assigned")         return "#C8BFB0";
  return "#A79A8D";
}

function statusBg(s) {
  if (s === "Converted")        return "rgba(181,140,145,0.12)";
  if (s === "Pending Approval") return "rgba(155,74,88,0.12)";
  if (s === "Contacted")        return "rgba(96,165,250,0.12)";
  if (s === "In Progress")      return "rgba(167,139,250,0.12)";
  if (s === "Assigned")         return "rgba(148,163,184,0.12)";
  return "rgba(71,85,105,0.12)";
}

function tierColor(t) {
  if (t === "Corporate") return { bg: "rgba(181,140,145,0.15)", color: "#B58C91" };
  if (t === "SME")       return { bg: "rgba(255,255,255,0.04)", color: "#C8BFB0" };
  return { bg: "rgba(148,163,184,0.08)", color: "#C8BFB0" };
}

function roleColor(r) {
  if (r === "admin")          return { bg: "rgba(192,64,64,0.1)", color: "#C04040" };
  if (r === "branch_manager") return { bg: "rgba(181,140,145,0.15)", color: "#B58C91" };
  return { bg: "rgba(52,211,153,0.1)", color: "#34d399" };
}

const EMPTY_LEAD = { name:"", phone:"", location:"", tier:"SME", score:50, source:"Manual", status:"New", agent:"", income:"", business_type:"", notes:"" };

// ── LOGIN ─────────────────────────────────────────────────────────────────────
function LoginScreen() {
  const [email, setEmail]         = useState("");
  const [password, setPassword]   = useState("");
  const [loading, setLoading]     = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError]         = useState("");
  const [mode, setMode]           = useState("login"); // "login" | "forgot"
  const [resetSent, setResetSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true); setError("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { setError("Invalid email or password."); setLoading(false); }
  }

  async function handleGoogle() {
    setGoogleLoading(true); setError("");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin }
    });
    if (error) { setError("Google sign-in failed. Try again."); setGoogleLoading(false); }
  }

  async function handleForgotPassword(e) {
    e.preventDefault();
    if (!email) return setError("Enter your email address first.");
    setResetLoading(true); setError("");
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin
    });
    setResetLoading(false);
    if (error) setError(error.message);
    else setResetSent(true);
  }

  const inputStyle = {background:"#2C1F22",border:"1px solid #6B5558",borderRadius:8,color:"#F2EEE7",fontSize:14,fontFamily:"inherit",padding:"12px 14px",outline:"none",width:"100%"};
  const labelStyle = {fontSize:11,color:"#8A7678",textTransform:"uppercase",letterSpacing:"0.08em",fontWeight:600};

  return (
    <div style={{minHeight:"100vh",background:"#1C1416",display:"flex",fontFamily:"'DM Sans',sans-serif"}}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",padding:24}}>
        <div style={{width:"100%",maxWidth:380}}>
          <div style={{marginBottom:32}}>
            <div style={{fontWeight:800,fontSize:28,color:"#F2EEE7",letterSpacing:"-0.03em",marginBottom:6}}>Scrape</div>
            <div style={{fontSize:14,color:"#A79A8D"}}>{mode==="forgot"?"Reset your password":"Sign in to your workspace"}</div>
          </div>

          {mode==="forgot" ? (
            resetSent ? (
              <div style={{textAlign:"center",padding:"24px 0"}}>
                <div style={{fontSize:32,marginBottom:12}}>📧</div>
                <div style={{fontWeight:600,color:"#F2EEE7",marginBottom:8}}>Check your email</div>
                <div style={{fontSize:13,color:"#8A7678",marginBottom:20}}>We sent a password reset link to <strong style={{color:"#B58C91"}}>{email}</strong></div>
                <button style={{background:"none",border:"none",color:"#B58C91",fontSize:13,cursor:"pointer",fontFamily:"inherit"}} onClick={()=>{setMode("login");setResetSent(false);}}>← Back to sign in</button>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} style={{display:"flex",flexDirection:"column",gap:14}}>
                <div style={{display:"flex",flexDirection:"column",gap:5}}>
                  <label style={labelStyle}>Email address</label>
                  <input type="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@bank.com" style={inputStyle} />
                </div>
                {error && <div style={{fontSize:12,color:"#C04040",background:"rgba(192,64,64,0.08)",border:"1px solid rgba(192,64,64,0.2)",borderRadius:7,padding:"9px 12px"}}>{error}</div>}
                <button type="submit" disabled={resetLoading} style={{background:"#B58C91",border:"none",borderRadius:8,color:"#1C1416",fontWeight:700,fontSize:14,fontFamily:"inherit",padding:"13px",cursor:resetLoading?"not-allowed":"pointer",opacity:resetLoading?0.7:1}}>
                  {resetLoading?"Sending…":"Send Reset Link"}
                </button>
                <button type="button" style={{background:"none",border:"none",color:"#8A7678",fontSize:13,cursor:"pointer",fontFamily:"inherit"}} onClick={()=>{setMode("login");setError("");}}>← Back to sign in</button>
              </form>
            )
          ) : (
            <>
              {/* Google button */}
              <button onClick={handleGoogle} disabled={googleLoading} style={{width:"100%",display:"flex",alignItems:"center",justifyContent:"center",gap:10,background:"#fff",border:"none",borderRadius:8,color:"#1a1a1a",fontWeight:600,fontSize:14,fontFamily:"inherit",padding:"12px",cursor:googleLoading?"not-allowed":"pointer",opacity:googleLoading?0.7:1,marginBottom:16}}>
                <svg width="18" height="18" viewBox="0 0 18 18"><path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/><path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z"/><path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/><path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z"/></svg>
                {googleLoading ? "Connecting…" : "Continue with Google"}
              </button>

              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}>
                <div style={{flex:1,height:1,background:"#6B5558"}}/>
                <span style={{fontSize:11,color:"#A79A8D"}}>or</span>
                <div style={{flex:1,height:1,background:"#6B5558"}}/>
              </div>

              <form onSubmit={handleLogin} style={{display:"flex",flexDirection:"column",gap:14}}>
                <div style={{display:"flex",flexDirection:"column",gap:5}}>
                  <label style={labelStyle}>Email address</label>
                  <input type="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@bank.com" style={inputStyle} />
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:5}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <label style={labelStyle}>Password</label>
                    <button type="button" style={{background:"none",border:"none",color:"#B58C91",fontSize:11,cursor:"pointer",fontFamily:"inherit"}} onClick={()=>{setMode("forgot");setError("");}}>Forgot password?</button>
                  </div>
                  <input type="password" required value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" style={inputStyle} />
                </div>
                {error && <div style={{fontSize:12,color:"#C04040",background:"rgba(192,64,64,0.08)",border:"1px solid rgba(192,64,64,0.2)",borderRadius:7,padding:"9px 12px"}}>{error}</div>}
                <button type="submit" disabled={loading} style={{marginTop:4,background:"#B58C91",border:"none",borderRadius:8,color:"#1C1416",fontWeight:700,fontSize:14,fontFamily:"inherit",padding:"13px",cursor:loading?"not-allowed":"pointer",opacity:loading?0.7:1}}>
                  {loading ? "Signing in…" : "Sign in"}
                </button>
              </form>
            </>
          )}
          <div style={{textAlign:"center",marginTop:28,fontSize:12,color:"#6B5558"}}>Scrape · Secure access only</div>
        </div>
      </div>
    </div>
  );
}

// ── ROOT ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [session, setSession]       = useState(undefined);
  const [profile, setProfile]       = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session) fetchProfile();
    else setProfile(null);
  }, [session]);

  async function fetchProfile() {
    setProfileLoading(true);
    const { data } = await supabase.from("profiles").select("*").eq("user_id", session.user.id).single();
    setProfile(data || null);
    setProfileLoading(false);
  }

  if (session === undefined || (session && profileLoading)) return (
    <div style={{minHeight:"100vh",background:"#1C1416",display:"flex",alignItems:"center",justifyContent:"center",color:"#A79A8D",fontFamily:"DM Sans,sans-serif",fontSize:13}}>
      Loading…
    </div>
  );

  if (!session) return <LoginScreen />;

  if (!profile) return (
    <div style={{minHeight:"100vh",background:"#1C1416",display:"flex",alignItems:"center",justifyContent:"center",padding:24,fontFamily:"DM Sans,sans-serif"}}>
      <div style={{textAlign:"center",maxWidth:360}}>
        <div style={{fontWeight:800,fontSize:28,color:"#F2EEE7",letterSpacing:"-0.02em",marginBottom:4}}>Scrape</div>
        <div style={{fontWeight:700,fontSize:18,color:"#F2EEE7",marginBottom:12,marginTop:24}}>Access Pending</div>
        <div style={{fontSize:13,color:"#A79A8D",lineHeight:1.7,marginBottom:20}}>Your account has been created but no role has been assigned. Contact your branch manager or administrator.</div>
        <div style={{fontSize:12,color:"#6B5558",marginBottom:20,background:"#2C1F22",border:"1px solid #6B5558",borderRadius:7,padding:"8px 12px"}}>{session.user.email}</div>
        <button style={{background:"transparent",border:"1px solid #6B5558",borderRadius:8,color:"#8A7678",fontSize:13,fontFamily:"inherit",padding:"10px 20px",cursor:"pointer"}} onClick={() => supabase.auth.signOut()}>Sign out</button>
      </div>
    </div>
  );

  return <Dashboard session={session} profile={profile} onLogout={() => supabase.auth.signOut()} />;
}

// ── DASHBOARD ─────────────────────────────────────────────────────────────────
function Dashboard({ session, profile, onLogout }) {
  const userId  = session.user.id;
  const role    = profile.role;
  const isAdmin = role === "admin";
  const isBM    = role === "branch_manager";
  const isAgent = role === "agent";
  const canSeeAll = isAdmin || isBM;

  const defaultPage = isAdmin ? "overview" : "leads";
  const [activePage, setActivePage]   = useState(defaultPage);
  const [overviewDrill, setOverviewDrill] = useState(null); // { title, leads[] }
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [leads, setLeads]             = useState([]);
  const [filtered, setFiltered]       = useState([]);
  const [loading, setLoading]         = useState(true);
  const [selected, setSelected]       = useState(null);
  const [editMode, setEditMode]       = useState(false);
  const [editData, setEditData]       = useState({});
  const [assignAgent, setAssignAgent] = useState("");
  const [toast, setToast]             = useState("");
  const [toastType, setToastType]     = useState("info");
  const [page, setPage]               = useState(1);
  const perPage = 10;

  const [selectedIds, setSelectedIds]       = useState(new Set());
  const [confirmDelete, setConfirmDelete]   = useState(false);
  const [bulkDeleting, setBulkDeleting]     = useState(false);
  const [bulkAssigning, setBulkAssigning]   = useState(false);
  const [deduping, setDeduping]             = useState(false);
  const [refreshing, setRefreshing]         = useState(false);
  const [addingLead, setAddingLead]         = useState(false);
  const [assigningAgent, setAssigningAgent] = useState(false);
  const [convertingLead, setConvertingLead] = useState(false);
  const [contactingLead, setContactingLead] = useState(false);
  const [savingEdit, setSavingEdit]         = useState(false);

  const [search, setSearch]               = useState("");
  const [tierFilter, setTierFilter]       = useState("");
  const [statusFilter, setStatusFilter]   = useState("");
  const [stateFilter, setStateFilter]     = useState("");
  const [btypeFilter, setBtypeFilter]     = useState("");
  const [dateFilter, setDateFilter]       = useState("");
  const [statClick, setStatClick]         = useState("");

  const [teamMembers, setTeamMembers]     = useState([]);
  const [showUserMgr, setShowUserMgr]     = useState(false);
  const [newUser, setNewUser]             = useState({ name:"", email:"", password:"", role:"agent", branch:"" });
  const [creatingUser, setCreatingUser]   = useState(false);
  const [userError, setUserError]         = useState("");
  const [userSuccess, setUserSuccess]     = useState("");
  const [editingMember, setEditingMember] = useState(null); // { id, name, branch, role }
  const [savingMember, setSavingMember]   = useState(false);
  const [deletingMember, setDeletingMember] = useState(null);

  const [showAddLead, setShowAddLead]     = useState(false);
  const [newLead, setNewLead]             = useState(EMPTY_LEAD);
  const [saving, setSaving]               = useState(false);

  const [showFindLeads, setShowFindLeads] = useState(false);
  const [scrapeConfig, setScrapeConfig]   = useState({ cities:[], business_types:[], keywords_map:{}, max_total:50 });
  const [scrapeDropdown, setScrapeDropdown] = useState({ states:false, types:false, keywords:false });
  const [scrapeJob, setScrapeJob]         = useState(null);
  const [scrapeStatus, setScrapeStatus]   = useState(null);
  const pollRef = useRef(null);

  const [showAuditLog, setShowAuditLog]   = useState(false);
  const [auditLogs, setAuditLogs]         = useState([]);
  const [auditLoading, setAuditLoading]   = useState(false);

  const [showApprovals, setShowApprovals] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [auditSearch, setAuditSearch]         = useState("");
  const [expandedAuditGroup, setExpandedAuditGroup] = useState(null);
  const [showTargets, setShowTargets]         = useState(false);
  const [targets, setTargets]                 = useState([]);
  const [targetsLoading, setTargetsLoading]   = useState(false);
  const [newTarget, setNewTarget]             = useState({ branch:"", agent_name:"", target_count:"" });
  const [savingTarget, setSavingTarget]       = useState(false);
  const currentMonth = new Date().toISOString().slice(0,7); // "2026-11"

  const [detailTab, setDetailTab]         = useState("info");
  const [comments, setComments]           = useState([]);
  const [newComment, setNewComment]       = useState("");
  const [leadHistory, setLeadHistory]     = useState([]);
  const [followUps, setFollowUps]         = useState([]);
  const [newFollowUp, setNewFollowUp]     = useState({ due_date:"", note:"" });

  // Pipeline / Kanban
  const [dragLeadId, setDragLeadId]       = useState(null);
  const [dragOverCol, setDragOverCol]     = useState(null);

  const AGING_DAYS = 7;

  useEffect(() => { fetchLeads(); fetchTeamMembers(); }, []);

  useEffect(() => {
    const { from, to } = getDateRange(dateFilter);
    let f = [...leads];
    if (search)       f = f.filter(l => l.name.toLowerCase().includes(search.toLowerCase()) || (l.phone||"").includes(search) || (l.location||"").toLowerCase().includes(search.toLowerCase()));
    if (tierFilter)   f = f.filter(l => l.tier === tierFilter);
    if (statusFilter) f = f.filter(l => l.status === statusFilter);
    if (stateFilter)  f = f.filter(l => (l.location||"").toLowerCase().includes(stateFilter.toLowerCase()));
    if (btypeFilter)  f = f.filter(l => (l.business_type||"").toLowerCase().includes(btypeFilter.toLowerCase()));
    if (from) f = f.filter(l => l.created_at && l.created_at >= from);
    if (to)   f = f.filter(l => l.created_at && l.created_at <= to + "T23:59:59");
    if (statClick === "new")       f = f.filter(l => l.status === "New");
    if (statClick === "assigned")  f = f.filter(l => l.status === "Assigned");
    if (statClick === "contacted") f = f.filter(l => l.status === "Contacted");
    if (statClick === "converted") f = f.filter(l => l.status === "Converted");
    if (statClick === "pending")   f = f.filter(l => l.status === "Pending Approval");
    if (statClick === "aging")     f = f.filter(l => isAging(l));
    setFiltered(f);
    setPage(1);
    setSelectedIds(new Set());
  }, [leads, search, tierFilter, statusFilter, stateFilter, btypeFilter, dateFilter, statClick]);

  function isAging(lead) {
    if (lead.status === "Converted") return false;
    if (!lead.created_at) return false;
    const days = (Date.now() - new Date(lead.created_at).getTime()) / (1000*60*60*24);
    return days > AGING_DAYS;
  }

  async function fetchLeads() {
    setLoading(true);
    let query = supabase.from("leads").select("*").order("created_at", { ascending: false });
    if (isAgent) query = query.eq("user_id", userId);
    const { data, error } = await query;
    if (!error) setLeads(data || []);
    setLoading(false);
  }
  async function handleRefresh() {
    setRefreshing(true);
    await fetchLeads();
    setRefreshing(false);
  }

  async function fetchTeamMembers() {
    if (!canSeeAll) return;
    const { data } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
    setTeamMembers(data || []);
  }

  async function fetchComments(leadId) {
    const { data } = await supabase.from("lead_comments").select("*").eq("lead_id", leadId).order("created_at", { ascending: true });
    setComments(data || []);
  }
  async function fetchHistory(leadId) {
    const { data } = await supabase.from("lead_history").select("*").eq("lead_id", leadId).order("created_at", { ascending: false });
    setLeadHistory(data || []);
  }
  async function fetchFollowUps(leadId) {
    const { data } = await supabase.from("follow_ups").select("*").eq("lead_id", leadId).order("due_date", { ascending: true });
    setFollowUps(data || []);
  }

  async function addComment() {
    if (!newComment.trim() || !selected) return;
    await supabase.from("lead_comments").insert([{ lead_id:selected.id, user_id:userId, user_name:profile.name, comment:newComment.trim() }]);
    await logAudit("Added comment","lead",selected.id,{comment:newComment.trim()});
    setNewComment(""); fetchComments(selected.id);
  }
  async function addFollowUp() {
    if (!newFollowUp.due_date || !selected) return;
    await supabase.from("follow_ups").insert([{ lead_id:selected.id, user_id:userId, due_date:newFollowUp.due_date, note:newFollowUp.note }]);
    setNewFollowUp({ due_date:"", note:"" }); fetchFollowUps(selected.id);
  }
  async function markFollowUpDone(id) {
    await supabase.from("follow_ups").update({ done:true }).eq("id",id);
    fetchFollowUps(selected.id);
  }

  async function logAudit(action, targetType, targetId, details) {
    await supabase.from("audit_logs").insert([{ user_id:userId, user_name:profile.name, action, target_type:targetType, target_id:String(targetId), details }]);
  }
  async function logHistory(leadId, field, oldVal, newVal) {
    await supabase.from("lead_history").insert([{ lead_id:leadId, user_id:userId, user_name:profile.name, field_changed:field, old_value:String(oldVal||""), new_value:String(newVal||"") }]);
  }

  async function assignLead() {
    if (!assignAgent || !selected) return showToast("Select a team member first","error");
    setAssigningAgent(true);
    const oldAgent = selected.agent;
    const { error } = await supabase.from("leads").update({ agent:assignAgent, status:selected.status==="New"?"Assigned":selected.status }).eq("id",selected.id);
    setAssigningAgent(false);
    if (!error) {
      await logAudit("Assigned lead","lead",selected.id,{from:oldAgent,to:assignAgent});
      await logHistory(selected.id,"agent",oldAgent,assignAgent);
      showToast("Assigned to "+assignAgent,"success");
      setSelected(null); fetchLeads();
    }
  }

  async function markStatus(newStatus) {
    if (!selected) return;
    if (newStatus==="Contacted") setContactingLead(true);
    else setConvertingLead(true);
    const old = selected.status;
    const actualStatus = ((isAgent || isBM) && newStatus === "Converted") ? "Pending Approval" : newStatus;
    const { error } = await supabase.from("leads").update({ status:actualStatus }).eq("id",selected.id);
    setContactingLead(false); setConvertingLead(false);
    if (!error) {
      await logAudit(`Marked as ${actualStatus}`,"lead",selected.id,{from:old,to:actualStatus});
      await logHistory(selected.id,"status",old,actualStatus);
      showToast(actualStatus==="Pending Approval"?"Sent for manager approval":`Marked as ${actualStatus}`,"success");
      setSelected(null); fetchLeads();
    }
  }

  async function approveConversion(leadId) {
    const { error } = await supabase.from("leads").update({ status:"Converted" }).eq("id",leadId);
    if (!error) {
      await logHistory(leadId,"status","Pending Approval","Converted");
      await logAudit("Approved conversion","lead",leadId,{});
      showToast("Conversion approved","success"); fetchLeads();
    }
  }
  async function rejectConversion(leadId) {
    const { error } = await supabase.from("leads").update({ status:"In Progress" }).eq("id",leadId);
    if (!error) {
      await logHistory(leadId,"status","Pending Approval","In Progress");
      await logAudit("Rejected conversion","lead",leadId,{});
      showToast("Sent back to In Progress","info"); fetchLeads();
    }
  }

  async function saveEdit() {
    if (!editData.name?.trim()) return showToast("Name is required","error");
    setSaving(true);
    const changes = {};
    ["name","phone","location","tier","status","agent","income","business_type","notes","score"].forEach(k=>{
      if (String(editData[k]||"") !== String(selected[k]||"")) changes[k]=editData[k];
    });
    const { error } = await supabase.from("leads").update({
      name:editData.name, phone:editData.phone, location:editData.location,
      tier:editData.tier, status:editData.status, agent:editData.agent,
      income:editData.income, business_type:editData.business_type,
      notes:editData.notes, score:Number(editData.score),
    }).eq("id",selected.id);
    setSaving(false);
    if (!error) {
      for (const [k,v] of Object.entries(changes)) await logHistory(selected.id,k,selected[k],v);
      await logAudit("Edited lead","lead",selected.id,changes);
      showToast("Lead updated","success");
      setEditMode(false); setSelected(null); fetchLeads();
    } else showToast("Error saving","error");
  }

  async function deleteSingleLead(id) {
    await supabase.from("leads").delete().eq("id",id);
    await logAudit("Deleted lead","lead",id,{});
    showToast("Lead deleted","info");
    setSelected(null); fetchLeads();
  }


  async function deleteSelected() {
    setBulkDeleting(true);
    const ids = [...selectedIds];
    for (const id of ids) { await supabase.from("leads").delete().eq("id",id); await logAudit("Deleted lead","lead",id,{}); }
    setBulkDeleting(false);
    showToast(`Deleted ${ids.length} lead${ids.length>1?"s":""}`, "info");
    setSelectedIds(new Set()); setConfirmDelete(false); fetchLeads();
  }

  async function saveLead() {
    if (!newLead.name.trim()) return showToast("Name is required","error");
    setSaving(true);
    const { error } = await supabase.from("leads").insert([{ ...newLead, score:Number(newLead.score), user_id:userId }]);
    setSaving(false);
    if (!error) {
      await logAudit("Added lead manually","lead",newLead.name,{});
      showToast("Lead added","success");
      setNewLead(EMPTY_LEAD); setShowAddLead(false); fetchLeads();
    } else showToast("Error saving lead","error");
  }

  async function createUser() {
    setUserError(""); setUserSuccess("");
    if (!newUser.name||!newUser.email||!newUser.password) return setUserError("All fields are required");
    if (newUser.password.length < 8) return setUserError("Password must be at least 8 characters");
    setCreatingUser(true);
    const { data:{ session:s } } = await supabase.auth.getSession();
    const r = await fetch(`${API_URL}/create-user`,{ method:"POST", headers:{"Content-Type":"application/json","Authorization":`Bearer ${s.access_token}`}, body:JSON.stringify(newUser) });
    const data = await r.json();
    setCreatingUser(false);
    if (data.error) return setUserError(data.error);
    setUserSuccess(`"${newUser.name}" created successfully`);
    // Add to local state immediately, then sync full list in background
    setTeamMembers(prev => [{
      id: data.user_id, user_id: data.user_id,
      name: newUser.name, role: newUser.role,
      branch: newUser.branch || null,
      created_at: new Date().toISOString()
    }, ...prev]);
    setNewUser({ name:"", email:"", password:"", role:"agent", branch:"" });
    fetchTeamMembers(); // background sync to get real profile id
  }

  async function saveMemberEdit() {
    if (!editingMember) return;
    setSavingMember(true);
    const { error } = await supabase.from("profiles").update({ name: editingMember.name, branch: editingMember.branch || null }).eq("id", editingMember.id);
    if (!error) {
      // Update local state immediately — no wait for re-fetch
      setTeamMembers(prev => prev.map(m => m.id === editingMember.id ? { ...m, name: editingMember.name, branch: editingMember.branch || null } : m));
      await logAudit("Edited team member", "user", editingMember.id, { name: editingMember.name, branch: editingMember.branch });
      showToast("Member updated", "success");
    } else {
      showToast("Error saving — try again", "error");
    }
    setSavingMember(false);
    setEditingMember(null);
  }

  async function deleteMember(member) {
    setDeletingMember(member.id);
    const { data:{ session:s } } = await supabase.auth.getSession();
    await fetch(`${API_URL}/delete-user`, { method:"POST", headers:{"Content-Type":"application/json","Authorization":`Bearer ${s.access_token}`}, body:JSON.stringify({ user_id: member.user_id }) });
    await supabase.from("profiles").delete().eq("id", member.id);
    await logAudit("Deleted team member", "user", member.id, { name: member.name, role: member.role });
    // Remove from local state immediately
    setTeamMembers(prev => prev.filter(m => m.id !== member.id));
    setDeletingMember(null);
    showToast(`${member.name} removed`, "info");
  }

  async function startScrape() {
    if (!scrapeConfig.cities.length) return showToast("Select at least one state","error");
    if (!scrapeConfig.business_types.length) return showToast("Select at least one business type","error");
    try {
      const { data:{ session:s } } = await supabase.auth.getSession();
      // Send only selected keywords — backend uses exactly these, no auto-expansion
      const payload = {
        cities: scrapeConfig.cities,
        business_types: scrapeConfig.business_types,
        keywords_map: scrapeConfig.keywords_map,
        max_total: scrapeConfig.max_total,
      };
      const r = await fetch(`${API_URL}/scrape`,{ method:"POST", headers:{"Content-Type":"application/json","Authorization":`Bearer ${s.access_token}`}, body:JSON.stringify(payload) });
      const data = await r.json();
      if (data.job_id) {
        setScrapeJob(data.job_id);
        setScrapeStatus({ status:"starting", added:0, progress:0 });
        pollRef.current = setInterval(()=>pollJob(data.job_id),2000);
        await logAudit("Started scraper","scraper",data.job_id,{cities:scrapeConfig.cities,types:scrapeConfig.business_types});
      } else showToast("Failed to start scraper","error");
    } catch { showToast("Cannot reach API","error"); }
  }

  async function pollJob(jobId) {
    try {
      const r = await fetch(`${API_URL}/status/${jobId}`);
      const data = await r.json();
      setScrapeStatus(data);
      if (data.status==="done") { clearInterval(pollRef.current); showToast(`Done! ${data.added} leads added`,"success"); fetchLeads(); setScrapeJob(null); setScrapeStatus(null); setShowFindLeads(false); setActivePage("leads"); }
      else if (data.status==="cancelled") { clearInterval(pollRef.current); showToast(`Cancelled — ${data.added} leads saved`,"info"); fetchLeads(); setScrapeJob(null); setScrapeStatus(null); setShowFindLeads(false); }
    } catch {}
  }

  function cancelScrape() {
    if (scrapeJob) fetch(`${API_URL}/cancel/${scrapeJob}`,{ method:"POST" });
    clearInterval(pollRef.current); setScrapeJob(null); setScrapeStatus(null);
  }

  async function fetchTargets() {
    setTargetsLoading(true);
    let query = supabase.from("targets").select("*").eq("month", currentMonth).order("created_at", { ascending: false });
    if (isBM && profile.branch) query = query.eq("branch", profile.branch);
    const { data } = await query;
    setTargets(data || []);
    setTargetsLoading(false);
  }

  async function saveTarget() {
    if (!newTarget.target_count || Number(newTarget.target_count) <= 0) return showToast("Enter a valid target number","error");
    setSavingTarget(true);
    const row = {
      month: currentMonth,
      target_count: Number(newTarget.target_count),
      created_by: userId,
      branch: isBM ? profile.branch : (newTarget.branch || null),
      agent_name: newTarget.agent_name || null,
    };
    const { error } = await supabase.from("targets").insert([row]);
    setSavingTarget(false);
    if (!error) {
      showToast("Target saved","success");
      setNewTarget({ branch:"", agent_name:"", target_count:"" });
      fetchTargets();
    } else showToast("Error saving target","error");
  }

  async function deleteTarget(id) {
    await supabase.from("targets").delete().eq("id", id);
    showToast("Target removed","info");
    fetchTargets();
  }

  async function fetchAuditLogs() {
    setAuditLoading(true);
    const { data:{ session:s } } = await supabase.auth.getSession();
    const r = await fetch(`${API_URL}/audit-logs`,{ headers:{"Authorization":`Bearer ${s.access_token}`} });
    const data = await r.json();
    setAuditLogs(Array.isArray(data)?data:[]); setAuditLoading(false);
  }

  async function pipelineDrop(targetStatus) {
    if (!dragLeadId) return;
    const lead = leads.find(l => l.id === dragLeadId);
    if (!lead || lead.status === targetStatus) { setDragLeadId(null); setDragOverCol(null); return; }
    const actualStatus = ((isAgent || isBM) && targetStatus === "Converted") ? "Pending Approval" : targetStatus;
    const old = lead.status;
    const { error } = await supabase.from("leads").update({ status: actualStatus }).eq("id", dragLeadId);
    if (!error) {
      await logAudit(`Marked as ${actualStatus}`, "lead", dragLeadId, { from: old, to: actualStatus });
      await logHistory(dragLeadId, "status", old, actualStatus);
      showToast(actualStatus === "Pending Approval" ? "Sent for manager approval" : `Moved to ${actualStatus}`, "success");
      fetchLeads();
    }
    setDragLeadId(null); setDragOverCol(null);
  }

  function showToast(msg, type="info") {
    setToast(msg); setToastType(type);
    setTimeout(()=>setToast(""),3500);
  }

  function exportCSV() {
    const cols = ["name","phone","location","tier","score","source","status","agent","income","business_type","notes"];
    const rows = [cols.join(","), ...filtered.map(l=>cols.map(c=>`"${(l[c]||"").toString().replace(/"/g,'""')}"`).join(","))];
    const a = document.createElement("a");
    a.href = "data:text/csv;charset=utf-8,"+encodeURIComponent(rows.join("\n"));
    a.download = "script.csv"; a.click();
    showToast("CSV downloaded","success");
    logAudit("Exported CSV","leads","bulk",{count:filtered.length});
  }

  function handleStatClick(key) {
    setStatClick(prev=>prev===key?"":key);
    setTierFilter(""); setStatusFilter(""); setSearch("");
  }

  function clearAllFilters() {
    setSearch(""); setTierFilter(""); setStatusFilter("");
    setStateFilter(""); setBtypeFilter(""); setDateFilter(""); setStatClick("");
  }

  function toggleSelect(id,e) {
    e.stopPropagation();
    setSelectedIds(prev=>{ const n=new Set(prev); n.has(id)?n.delete(id):n.add(id); return n; });
  }

  function toggleSelectAll() {
    if (selectedIds.size===pageLeads.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(pageLeads.map(l=>l.id)));
  }

  function openLead(l) {
    setSelected(l); setAssignAgent(l.agent||""); setEditMode(false); setDetailTab("info");
    fetchComments(l.id); fetchHistory(l.id); fetchFollowUps(l.id);
  }

  const totalPages       = Math.ceil(filtered.length/perPage);
  const pageLeads        = filtered.slice((page-1)*perPage, page*perPage);
  const agingCount       = leads.filter(isAging).length;
  const pendingApprovals = leads.filter(l=>l.status==="Pending Approval");
  const stats = {
    total:     leads.length,
    newLeads:  leads.filter(l=>l.status==="New").length,
    assigned:  leads.filter(l=>l.status==="Assigned").length,
    contacted: leads.filter(l=>l.status==="Contacted").length,
    converted: leads.filter(l=>l.status==="Converted").length,
    pending:   pendingApprovals.length,
  };
  const hasActiveFilters = search||tierFilter||statusFilter||stateFilter||btypeFilter||dateFilter||statClick;
  const leaderboard = teamMembers.filter(m=>m.role==="agent").map(m=>({
    name:m.name,
    assigned:leads.filter(l=>l.agent===m.name).length,
    converted:leads.filter(l=>l.agent===m.name&&l.status==="Converted").length,
  })).sort((a,b)=>b.converted-a.converted);
  const today = new Date().toISOString().split("T")[0];

  // Role-based nav
  const NAV = isAgent ? [
    { id:"leads",      icon:"◈", label:"My Leads" },
    { id:"pipeline",   icon:"⬛", label:"Pipeline" },
    { id:"scrape",     icon:"⊕", label:"Find Leads" },
    { id:"dedup",      icon:"⊗", label:"Deduplication" },
  ] : isBM ? [
    { id:"leads",      icon:"◈", label:"Branch Leads" },
    { id:"analytics",  icon:"◑", label:"Analytics" },
    { id:"pipeline",   icon:"⬛", label:"Pipeline" },
    { id:"approvals",  icon:"⏳", label:"Approvals", badge:stats.pending },
    { id:"leaderboard",icon:"▲", label:"Agents" },
    { id:"targets",    icon:"◎", label:"Targets" },
    { id:"audit",      icon:"≡", label:"Audit Log" },
  ] : [
    // Super Admin — oversight only
    { id:"overview",   icon:"◈", label:"Overview" },
    { id:"analytics",  icon:"◑", label:"Analytics" },
    { id:"approvals",  icon:"⏳", label:"Approvals", badge:stats.pending },
    { id:"team",       icon:"◉", label:"Team" },
    { id:"leaderboard",icon:"▲", label:"Leaderboard" },
    { id:"targets",    icon:"◎", label:"Targets" },
    { id:"audit",      icon:"≡", label:"Audit Log" },
  ];

  function navClick(id) {
    if (id==="scrape")     { setShowFindLeads(true); setSidebarOpen(false); return; }
    if (id==="approvals")  { setShowApprovals(true); setSidebarOpen(false); return; }
    if (id==="team")       { setShowUserMgr(true); setUserError(""); setUserSuccess(""); setSidebarOpen(false); return; }
    if (id==="leaderboard"){ setActivePage("leaderboard"); setSidebarOpen(false); return; }
    if (id==="targets")    { setShowTargets(true); fetchTargets(); setSidebarOpen(false); return; }
    if (id==="audit")      { setShowAuditLog(true); fetchAuditLogs(); setSidebarOpen(false); return; }
    setActivePage(id); setSidebarOpen(false);
  }

  const Sidebar = () => (
    <div style={{display:"flex",flexDirection:"column",height:"100%",padding:"24px 0"}}>
      {/* Logo */}
      <div style={{padding:"0 20px 28px",borderBottom:"1px solid rgba(181,140,145,0.1)"}}>
        <div style={{fontWeight:800,fontSize:22,color:"#F2EEE7",letterSpacing:"-0.03em"}}>Scrape</div>
        <div style={{fontSize:10,color:"#A79A8D",marginTop:3,textTransform:"uppercase",letterSpacing:"0.1em"}}>Lead Intelligence</div>
      </div>
      {/* Nav */}
      <div style={{flex:1,padding:"16px 12px",display:"flex",flexDirection:"column",gap:2}}>
        {NAV.map(n=>(
          <button key={n.id} onClick={()=>navClick(n.id)} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",borderRadius:8,border:"none",background:activePage===n.id?"rgba(181,140,145,0.1)":"transparent",color:activePage===n.id?"#B58C91":"#8A7678",cursor:"pointer",fontFamily:"inherit",fontSize:13,fontWeight:500,textAlign:"left",width:"100%",transition:"all 0.15s",position:"relative"}}>
            <span style={{fontSize:14,width:16,textAlign:"center"}}>{n.icon}</span>
            {n.label}
            {n.badge>0&&<span style={{marginLeft:"auto",background:"#9B4A58",color:"#fff",borderRadius:99,padding:"1px 7px",fontSize:10,fontWeight:700}}>{n.badge}</span>}
          </button>
        ))}
      </div>
      {/* User info */}
      <div style={{padding:"16px 20px",borderTop:"1px solid rgba(255,255,255,0.04)"}}>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}>
          <div style={{width:32,height:32,borderRadius:"50%",background:"rgba(181,140,145,0.15)",border:"1px solid rgba(181,140,145,0.3)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,color:"#B58C91",flexShrink:0}}>
            {(profile.name||"U")[0].toUpperCase()}
          </div>
          <div style={{minWidth:0}}>
            <div style={{fontSize:12,fontWeight:600,color:"#DDD8D0",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{profile.name||"User"}</div>
            <div style={{fontSize:10,color:"#A79A8D",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{session.user.email}</div>
          </div>
        </div>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <span style={{fontSize:10,fontWeight:600,padding:"2px 8px",borderRadius:4,textTransform:"uppercase",letterSpacing:"0.05em",background:roleColor(role).bg,color:roleColor(role).color}}>{role.replace("_"," ")}</span>
          <button onClick={onLogout} style={{background:"none",border:"none",color:"#A79A8D",fontSize:11,cursor:"pointer",fontFamily:"inherit",padding:"4px 8px",borderRadius:5,transition:"color 0.15s"}} onMouseOver={e=>e.target.style.color="#C04040"} onMouseOut={e=>e.target.style.color="#A79A8D"}>Sign out</button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #1C1416; color: #F2EEE7; font-family: 'DM Sans', sans-serif; min-height: 100vh; }

        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #6B5558; border-radius: 2px; }

        .app-layout { display: flex; min-height: 100vh; }

        .sidebar { width: 220px; background: #302729; border-right: 1px solid rgba(84,45,56,0.4); flex-shrink: 0; position: sticky; top: 0; height: 100vh; overflow-y: auto; }
        @media(max-width:768px){ .sidebar { display: none; } }

        .sidebar-mobile-overlay { display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.7); z-index: 300; }
        .sidebar-mobile { display: none; position: fixed; top: 0; left: 0; bottom: 0; width: 240px; background: #302729; border-right: 1px solid rgba(84,45,56,0.4); z-index: 301; overflow-y: auto; }
        @media(max-width:768px){
          .sidebar-mobile-overlay.open { display: block; }
          .sidebar-mobile.open { display: block; }
        }

        .mobile-topbar { display: none; position: sticky; top: 0; z-index: 100; background: rgba(28,20,22,0.97); backdrop-filter: blur(12px); border-bottom: 1px solid rgba(255,255,255,0.04); padding: 12px 16px; align-items: center; justify-content: space-between; }
        @media(max-width:768px){ .mobile-topbar { display: flex; } }

        .main-content { flex: 1; min-width: 0; overflow-x: hidden; }
        .page-inner { padding: 24px; max-width: 1200px; margin: 0 auto; }
        @media(max-width:768px){ .page-inner { padding: 16px; } }

        .page-header { margin-bottom: 24px; display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
        .page-title { font-size: 20px; font-weight: 800; color: #F2EEE7; letter-spacing: -0.02em; }
        .page-sub { font-size: 12px; color: #A79A8D; margin-top: 3px; }

        .btn { display: inline-flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 600; padding: 8px 14px; border-radius: 7px; border: 1px solid rgba(255,255,255,0.08); background: rgba(255,255,255,0.04); color: #C8BFB0; cursor: pointer; transition: all 0.15s; white-space: nowrap; font-family: inherit; letter-spacing: 0.01em; }
        .btn:hover { background: rgba(255,255,255,0.08); color: #DDD8D0; border-color: rgba(255,255,255,0.12); }
        .btn-gold { background: #B58C91; border-color: #B58C91; color: #1C1416; font-weight: 700; }
        .btn-gold:hover { background: #C4989D; border-color: #C4989D; color: #1C1416; }
        .btn-danger { border-color: rgba(192,64,64,0.2); color: #C04040; }
        .btn-danger:hover { background: rgba(192,64,64,0.08); border-color: rgba(192,64,64,0.3); }

        .card { background: #2C1F22; border: 1px solid rgba(255,255,255,0.04); border-radius: 12px; }

        .stat-grid { display: grid; grid-template-columns: repeat(2,1fr); gap: 10px; margin-bottom: 20px; }
        @media(min-width:600px){ .stat-grid { grid-template-columns: repeat(3,1fr); } }
        @media(min-width:900px){ .stat-grid { grid-template-columns: repeat(6,1fr); } }
        .stat-card { background: #2C1F22; border: 1px solid rgba(255,255,255,0.04); border-radius: 12px; padding: 16px; cursor: pointer; transition: all 0.15s; user-select: none; }
        .stat-card:hover { border-color: rgba(181,140,145,0.2); background: #321F23; }
        .stat-card.active { border-color: rgba(181,140,145,0.4); background: #321F23; }
        .stat-card.pending-card { border-color: rgba(155,74,88,0.15); }
        .stat-card.pending-card.active { border-color: rgba(155,74,88,0.4); }
        .stat-card.aging-card { border-color: rgba(192,64,64,0.1); }
        .stat-card.aging-card.active { border-color: rgba(192,64,64,0.3); }
        .stat-num { font-weight: 800; font-size: 28px; letter-spacing: -0.04em; color: #F2EEE7; line-height: 1; }
        .stat-lbl { font-size: 11px; color: #A79A8D; margin-top: 6px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.06em; }
        .stat-accent { color: #B58C91; }

        .filters-card { background: #2C1F22; border: 1px solid rgba(255,255,255,0.04); border-radius: 12px; padding: 14px; margin-bottom: 14px; }
        .filters-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
        .filters-label { font-size: 10px; font-weight: 700; color: #A79A8D; text-transform: uppercase; letter-spacing: 0.08em; }
        .filters-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 7px; }
        @media(min-width:700px){ .filters-grid { grid-template-columns: repeat(3,1fr); } }
        @media(min-width:1000px){ .filters-grid { grid-template-columns: repeat(6,1fr); } }
        .fi { background: #1C1416; border: 1px solid rgba(255,255,255,0.05); border-radius: 7px; color: #C8BFB0; font-size: 12px; font-family: inherit; padding: 7px 10px; outline: none; width: 100%; transition: border-color 0.15s; }
        .fi:focus { border-color: rgba(181,140,145,0.3); }
        .fi::placeholder { color: #6B5558; }
        .fi option { background: #2C1F22; }
        .search-full { grid-column: 1 / -1; }
        @media(min-width:1000px){ .search-full { grid-column: auto; } }
        .clear-link { font-size: 11px; color: #A79A8D; background: none; border: none; cursor: pointer; font-family: inherit; padding: 0; transition: color 0.15s; }
        .clear-link:hover { color: #C04040; }

        .bulk-bar { display: flex; align-items: center; gap: 10px; padding: 10px 14px; background: rgba(181,140,145,0.05); border: 1px solid rgba(181,140,145,0.15); border-radius: 10px; margin-bottom: 12px; flex-wrap: wrap; }
        .bulk-bar span { font-size: 12px; color: #B58C91; font-weight: 600; flex: 1; }

        .table-card { background: #2C1F22; border: 1px solid rgba(255,255,255,0.04); border-radius: 12px; overflow: hidden; }
        .table-head { display: flex; align-items: center; justify-content: space-between; padding: 14px 16px; border-bottom: 1px solid rgba(255,255,255,0.04); flex-wrap: wrap; gap: 8px; }
        .table-title { font-size: 13px; font-weight: 700; color: #F2EEE7; }
        .lead-badge { font-size: 10px; color: #A79A8D; background: #1C1416; border: 1px solid rgba(255,255,255,0.05); padding: 2px 8px; border-radius: 20px; margin-left: 8px; font-weight: 600; }
        .tbl-scroll { overflow-x: auto; -webkit-overflow-scrolling: touch; }
        table { width: 100%; border-collapse: collapse; font-size: 12px; min-width: 640px; }
        thead th { text-align: left; padding: 10px 14px; font-size: 10px; font-weight: 700; color: #6B5558; letter-spacing: 0.08em; text-transform: uppercase; border-bottom: 1px solid rgba(255,255,255,0.04); background: #1C1416; white-space: nowrap; }
        tbody tr { border-bottom: 1px solid rgba(255,255,255,0.03); cursor: pointer; transition: background 0.1s; }
        tbody tr:last-child { border-bottom: none; }
        tbody tr:hover { background: rgba(255,255,255,0.02); }
        tbody tr.row-sel { background: rgba(181,140,145,0.04); }
        tbody tr.row-aging { border-left: 2px solid #C04040; }
        tbody tr.row-pending { border-left: 2px solid #9B4A58; }
        td { padding: 11px 14px; color: #A79A8D; vertical-align: middle; }
        td.td-name { color: #DDD8D0; font-weight: 600; white-space: nowrap; }
        td.td-chk { width: 36px; }
        input[type="checkbox"] { width: 14px; height: 14px; accent-color: #B58C91; cursor: pointer; }

        .pill { display: inline-flex; align-items: center; font-size: 10px; font-weight: 600; padding: 3px 8px; border-radius: 4px; white-space: nowrap; letter-spacing: 0.03em; }
        .status-pill { display: inline-flex; align-items: center; gap: 5px; white-space: nowrap; font-size: 11px; font-weight: 500; padding: 3px 9px; border-radius: 20px; }
        .score-wrap { display: flex; align-items: center; gap: 7px; min-width: 70px; }
        .score-bar { flex: 1; height: 3px; background: #0a1628; border-radius: 2px; overflow: hidden; min-width: 36px; }
        .score-fill { height: 100%; border-radius: 2px; background: #B58C91; }

        .pagination { display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; border-top: 1px solid rgba(255,255,255,0.04); flex-wrap: wrap; gap: 8px; }
        .pg-info { font-size: 11px; color: #A79A8D; }
        .pg-btns { display: flex; gap: 4px; flex-wrap: wrap; }
        .pg-btn { background: #1C1416; border: 1px solid rgba(255,255,255,0.05); color: #A79A8D; font-size: 11px; font-family: inherit; padding: 4px 10px; border-radius: 5px; cursor: pointer; transition: all 0.15s; }
        .pg-btn:hover { color: #C8BFB0; border-color: rgba(255,255,255,0.1); }
        .pg-btn.pg-active { background: #B58C91; border-color: #B58C91; color: #1C1416; font-weight: 700; }
        .pg-btn:disabled { opacity: 0.2; pointer-events: none; }

        /* Lead cards for mobile */
        .lead-cards { display: none; flex-direction: column; gap: 8px; padding: 12px; }
        @media(max-width:640px){ .tbl-scroll { display: none; } .lead-cards { display: flex; } }
        .lead-card { background: #1C1416; border: 1px solid rgba(255,255,255,0.05); border-radius: 10px; padding: 14px; cursor: pointer; transition: all 0.15s; }
        .lead-card:hover { border-color: rgba(181,140,145,0.2); }
        .lead-card.lc-aging { border-left: 2px solid #C04040; }
        .lead-card.lc-pending { border-left: 2px solid #9B4A58; }
        .lc-top { display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; margin-bottom: 8px; }
        .lc-name { font-size: 14px; font-weight: 700; color: #F2EEE7; }
        .lc-meta { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 4px; }
        .lc-tag { font-size: 10px; color: #A79A8D; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 4px; padding: 2px 6px; }
        .lc-bottom { display: flex; align-items: center; justify-content: space-between; margin-top: 8px; }

        .overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.7); z-index: 200; backdrop-filter: blur(2px); }
        .drawer { position: fixed; top: 0; right: 0; bottom: 0; width: min(420px,100vw); background: #1C1416; border-left: 1px solid rgba(255,255,255,0.06); z-index: 201; overflow-y: auto; display: flex; flex-direction: column; }
        .drawer-header { padding: 18px 20px; border-bottom: 1px solid rgba(255,255,255,0.04); display: flex; align-items: center; justify-content: space-between; position: sticky; top: 0; background: #1C1416; z-index: 1; }
        .drawer-body { padding: 20px; display: flex; flex-direction: column; gap: 14px; flex: 1; }
        .drawer-name { font-weight: 800; font-size: 18px; color: #F2EEE7; letter-spacing: -0.02em; }
        .drawer-row { display: flex; justify-content: space-between; align-items: flex-start; padding: 9px 0; border-bottom: 1px solid rgba(255,255,255,0.03); font-size: 12px; gap: 12px; }
        .dr-label { color: #A79A8D; flex-shrink: 0; font-weight: 500; }
        .dr-value { color: #C8BFB0; font-weight: 500; text-align: right; }

        .detail-tabs { display: flex; gap: 0; border-bottom: 1px solid rgba(255,255,255,0.05); }
        .dtab { background: none; border: none; border-bottom: 2px solid transparent; color: #A79A8D; font-family: inherit; font-size: 12px; font-weight: 600; padding: 8px 14px; cursor: pointer; margin-bottom: -1px; transition: all 0.15s; letter-spacing: 0.02em; }
        .dtab.active { color: #B58C91; border-bottom-color: #B58C91; }

        .comment-list { display: flex; flex-direction: column; gap: 8px; max-height: 220px; overflow-y: auto; }
        .comment-item { background: #1C1416; border: 1px solid rgba(255,255,255,0.04); border-radius: 8px; padding: 10px 12px; }
        .comment-meta { font-size: 10px; color: #A79A8D; margin-bottom: 4px; font-weight: 500; }
        .comment-text { font-size: 12px; color: #C8BFB0; line-height: 1.5; }

        .history-list { display: flex; flex-direction: column; gap: 8px; max-height: 260px; overflow-y: auto; }
        .history-item { font-size: 11px; color: #A79A8D; border-left: 2px solid #6B5558; padding: 4px 10px; }

        .followup-item { background: #1C1416; border: 1px solid rgba(255,255,255,0.04); border-radius: 8px; padding: 10px 12px; display: flex; align-items: center; gap: 8px; }
        .followup-item.overdue { border-color: rgba(192,64,64,0.2); }
        .followup-item.fu-done { opacity: 0.35; }

        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.8); z-index: 300; display: flex; align-items: flex-end; justify-content: center; backdrop-filter: blur(4px); }
        @media(min-width:600px){ .modal-overlay { align-items: center; } }
        .modal { background: #1C1416; border: 1px solid rgba(255,255,255,0.06); border-radius: 16px 16px 0 0; width: 100%; max-width: 540px; max-height: 92vh; overflow-y: auto; display: flex; flex-direction: column; }
        @media(min-width:600px){ .modal { border-radius: 16px; } }
        .modal-header { padding: 18px 20px; border-bottom: 1px solid rgba(255,255,255,0.04); display: flex; align-items: center; justify-content: space-between; position: sticky; top: 0; background: #1C1416; }
        .modal-title { font-size: 15px; font-weight: 800; color: #F2EEE7; letter-spacing: -0.02em; }
        .modal-body { padding: 20px; display: flex; flex-direction: column; gap: 14px; }

        .form-group { display: flex; flex-direction: column; gap: 5px; }
        .form-label { font-size: 10px; color: #A79A8D; text-transform: uppercase; letter-spacing: 0.08em; font-weight: 700; }
        .form-input, .form-select, .form-textarea { background: #1C1416; border: 1px solid rgba(255,255,255,0.06); border-radius: 8px; color: #C8BFB0; font-size: 13px; font-family: inherit; padding: 10px 12px; outline: none; width: 100%; transition: border-color 0.15s; }
        .form-input:focus, .form-select:focus { border-color: rgba(181,140,145,0.3); color: #DDD8D0; }
        .form-input::placeholder { color: #6B5558; }
        .form-textarea { resize: vertical; min-height: 70px; }
        .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .form-hint { font-size: 10px; color: #6B5558; margin-top: 2px; }

        .user-table { width: 100%; border-collapse: collapse; font-size: 12px; }
        .user-table th { text-align: left; padding: 8px 10px; font-size: 10px; color: #6B5558; letter-spacing: 0.08em; text-transform: uppercase; border-bottom: 1px solid rgba(255,255,255,0.04); font-weight: 700; }
        .user-table td { padding: 10px 10px; border-bottom: 1px solid rgba(255,255,255,0.03); color: #A79A8D; }
        .user-table td:first-child { color: #C8BFB0; font-weight: 600; }

        .audit-item { background: #1C1416; border: 1px solid rgba(255,255,255,0.04); border-radius: 8px; padding: 10px 12px; }
        .audit-action { color: #C8BFB0; font-weight: 600; font-size: 12px; }
        .audit-meta { font-size: 10px; color: #A79A8D; margin-top: 3px; }

        .lb-row { display: flex; align-items: center; gap: 12px; padding: 12px 14px; background: #1C1416; border: 1px solid rgba(255,255,255,0.04); border-radius: 10px; }
        .lb-rank { font-size: 11px; font-weight: 800; color: #6B5558; width: 24px; text-align: center; }
        .lb-rank.top { color: #B58C91; }
        .lb-name { flex: 1; font-size: 13px; color: #DDD8D0; font-weight: 600; }
        .lb-stat { font-size: 11px; color: #A79A8D; }
        .lb-converted { font-size: 14px; font-weight: 800; color: #B58C91; min-width: 30px; text-align: right; }

        .progress-wrap { background: #1C1416; border-radius: 6px; height: 6px; overflow: hidden; }
        .progress-fill { height: 100%; background: linear-gradient(90deg,#B58C91,#C4989D); border-radius: 6px; transition: width 0.4s; }

        .kw-pill { display: inline-flex; align-items: center; gap: 4px; font-size: 11px; padding: 4px 10px; border-radius: 20px; border: 1px solid; cursor: pointer; transition: all 0.1s; font-family: inherit; }

        .confirm-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.85); z-index: 400; display: flex; align-items: center; justify-content: center; padding: 20px; backdrop-filter: blur(4px); }
        .confirm-box { background: #1C1416; border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; padding: 24px; max-width: 340px; width: 100%; display: flex; flex-direction: column; gap: 16px; }
        .confirm-title { font-size: 15px; font-weight: 800; color: #F2EEE7; }
        .confirm-body { font-size: 13px; color: #A79A8D; line-height: 1.6; }

        .role-badge { font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 4px; text-transform: uppercase; letter-spacing: 0.06em; }
        .aging-tag { font-size: 9px; background: rgba(192,64,64,0.1); color: #C04040; border: 1px solid rgba(192,64,64,0.2); border-radius: 4px; padding: 1px 5px; margin-left: 6px; font-weight: 700; letter-spacing: 0.03em; }

        .toast { position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%) translateY(80px); border-radius: 10px; padding: 11px 20px; font-size: 12px; font-weight: 600; z-index: 500; transition: transform 0.3s; white-space: nowrap; font-family: inherit; border: 1px solid; }
        .toast.show { transform: translateX(-50%) translateY(0); }
        .toast-success { background: rgba(181,140,145,0.1); border-color: rgba(181,140,145,0.3); color: #B58C91; }
        .toast-error   { background: rgba(192,64,64,0.1); border-color: rgba(192,64,64,0.3); color: #C04040; }
        .toast-info    { background: rgba(255,255,255,0.04); border-color: rgba(255,255,255,0.08); color: #C8BFB0; }

        .empty-state { text-align: center; padding: 60px 24px; color: #6B5558; font-size: 13px; }
        .empty-icon { font-size: 32px; margin-bottom: 12px; opacity: 0.3; }
      `}</style>

      <div className="app-layout">
        {/* Desktop Sidebar */}
        <div className="sidebar"><Sidebar /></div>

        {/* Mobile sidebar overlay */}
        <div className={`sidebar-mobile-overlay${sidebarOpen?" open":""}`} onClick={()=>setSidebarOpen(false)} />
        <div className={`sidebar-mobile${sidebarOpen?" open":""}`}><Sidebar /></div>

        {/* Main */}
        <div className="main-content">
          {/* Mobile top bar */}
          <div className="mobile-topbar">
            <button onClick={()=>setSidebarOpen(true)} style={{background:"none",border:"none",color:"#8A7678",cursor:"pointer",fontSize:18,padding:"4px",fontFamily:"inherit"}}>☰</button>
            <div style={{fontWeight:800,fontSize:18,color:"#F2EEE7",letterSpacing:"-0.02em"}}>Scrape</div>
            <div style={{width:60}} />
          </div>

          <div className="page-inner">

            {/* ── LEADERBOARD PAGE (BM and Admin) ─────────────── */}
            {activePage === "leaderboard" && canSeeAll && (
              <div>
                <div className="page-header">
                  <div>
                    <div className="page-title">{isBM?"My Agents":"Agent Leaderboard"}</div>
                    <div className="page-sub">Ranked by conversions</div>
                  </div>
                </div>
                {leaderboard.length===0?(
                  <div style={{fontSize:13,color:"#A79A8D",textAlign:"center",padding:"40px 0"}}>No agents yet</div>
                ):(
                  <div style={{display:"flex",flexDirection:"column",gap:8}}>
                    {leaderboard.map((a,i)=>{
                      const convRate = a.assigned>0?Math.round(a.converted/a.assigned*100):0;
                      const medal = i===0?"🥇":i===1?"🥈":i===2?"🥉":null;
                      return (
                        <div key={a.name} style={{background:"#1C1416",border:`1px solid ${i<3?"rgba(181,140,145,0.2)":"rgba(255,255,255,0.05)"}`,borderRadius:10,padding:"14px 16px",display:"flex",alignItems:"center",gap:12,flexWrap:"wrap"}}>
                          <div style={{fontSize:16,fontWeight:800,color:i<3?"#B58C91":"#A79A8D",width:28,flexShrink:0}}>{medal||`#${i+1}`}</div>
                          <div style={{width:38,height:38,borderRadius:"50%",background:"rgba(181,140,145,0.1)",border:"1px solid rgba(181,140,145,0.2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:700,color:"#B58C91",flexShrink:0}}>{a.name[0].toUpperCase()}</div>
                          <div style={{flex:1,minWidth:100}}>
                            <div style={{fontWeight:700,fontSize:14,color:"#F2EEE7"}}>{a.name}</div>
                            <div style={{fontSize:11,color:"#A79A8D",marginTop:2}}>{a.assigned} leads assigned · {convRate}% conversion</div>
                          </div>
                          <div style={{display:"flex",gap:16,flexShrink:0}}>
                            <div style={{textAlign:"center"}}><div style={{fontSize:20,fontWeight:800,color:"#B58C91"}}>{a.converted}</div><div style={{fontSize:10,color:"#A79A8D"}}>Converted</div></div>
                            <div style={{textAlign:"center"}}><div style={{fontSize:20,fontWeight:800,color:"#8A7678"}}>{a.assigned}</div><div style={{fontSize:10,color:"#A79A8D"}}>Assigned</div></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ── ANALYTICS PAGE ───────────────────────────────── */}
            {activePage === "analytics" && (() => {
              // ── derived data ──────────────────────────────────────
              const statusList = ["New","Assigned","Contacted","In Progress","Pending Approval","Converted"];
              const byStatus   = statusList.map(s=>({ label:s, count:leads.filter(l=>l.status===s).length }));

              const tierList   = ["SME","Corporate","Mass Market"];
              const byTier     = tierList.map(t=>({ label:t, count:leads.filter(l=>l.tier===t).length }));

              const btypeCounts = {};
              leads.forEach(l=>{ if(l.business_type){ btypeCounts[l.business_type]=(btypeCounts[l.business_type]||0)+1; } });
              const byBtype = Object.entries(btypeCounts).sort((a,b)=>b[1]-a[1]).slice(0,8).map(([label,count])=>({label,count}));

              const agentCounts = {};
              leads.forEach(l=>{ if(l.agent){ agentCounts[l.agent]=(agentCounts[l.agent]||0)+1; } });
              const byAgent = Object.entries(agentCounts).sort((a,b)=>b[1]-a[1]).slice(0,8).map(([label,count])=>({label,count}));

              // leads by month (last 6)
              const monthMap = {};
              leads.forEach(l=>{
                if(!l.created_at) return;
                const m = l.created_at.slice(0,7);
                monthMap[m]=(monthMap[m]||0)+1;
              });
              const months = [];
              for(let i=5;i>=0;i--){
                const d=new Date(); d.setMonth(d.getMonth()-i);
                const key=d.toISOString().slice(0,7);
                months.push({ label:key.slice(5)+" "+key.slice(0,4), count:monthMap[key]||0 });
              }

              const totalLeads = leads.length;
              const convertedLeads = leads.filter(l=>l.status==="Converted").length;
              const convRate = totalLeads>0 ? ((convertedLeads/totalLeads)*100).toFixed(1) : 0;
              const avgScore = totalLeads>0 ? (leads.reduce((s,l)=>s+(l.score||0),0)/totalLeads).toFixed(0) : 0;

              // ── small inline bar chart ───────────────────────────
              function BarChart({ data, color="#B58C91", height=120 }) {
                const max = Math.max(...data.map(d=>d.count), 1);
                const W = 100/data.length;
                return (
                  <div style={{overflowX:"auto"}}>
                    <div style={{display:"flex",alignItems:"flex-end",gap:4,height,minWidth:data.length*44}}>
                      {data.map((d,i)=>(
                        <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:4,minWidth:36}}>
                          <span style={{fontSize:10,color:"#8A7678",fontWeight:600}}>{d.count}</span>
                          <div style={{width:"100%",height:Math.max((d.count/max)*(height-28),4),background:color,borderRadius:"4px 4px 0 0",opacity:0.85,transition:"height 0.3s"}}/>
                          <span style={{fontSize:9,color:"#A79A8D",textAlign:"center",lineHeight:1.2,wordBreak:"break-word",maxWidth:40}}>{d.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              }

              function KpiCard({ label, value, sub, accent }) {
                return (
                  <div style={{background:"#2C1F22",border:"1px solid rgba(181,140,145,0.1)",borderRadius:12,padding:"18px 20px",flex:"1 1 140px",minWidth:130}}>
                    <div style={{fontSize:28,fontWeight:800,color:accent||"#F2EEE7",letterSpacing:"-0.03em"}}>{value}</div>
                    <div style={{fontSize:12,color:"#8A7678",marginTop:2}}>{label}</div>
                    {sub&&<div style={{fontSize:11,color:"#A79A8D",marginTop:4}}>{sub}</div>}
                  </div>
                );
              }

              function ChartCard({ title, children }) {
                return (
                  <div style={{background:"#2C1F22",border:"1px solid rgba(181,140,145,0.08)",borderRadius:12,padding:"18px 20px"}}>
                    <div style={{fontSize:12,fontWeight:700,color:"#C8BFB0",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:14}}>{title}</div>
                    {children}
                  </div>
                );
              }

              return (
                <div>
                  <div className="page-header">
                    <div>
                      <div className="page-title">Analytics</div>
                      <div className="page-sub">{totalLeads} leads total</div>
                    </div>
                    <button className="btn" disabled={refreshing} onClick={handleRefresh}>{refreshing?"…":"↻ Refresh"}</button>
                  </div>

                  {/* KPI row */}
                  <div style={{display:"flex",gap:12,flexWrap:"wrap",marginBottom:20}}>
                    <KpiCard label="Total Leads"      value={totalLeads}       accent="#F2EEE7" />
                    <KpiCard label="Converted"        value={convertedLeads}   accent="#B58C91" sub={`${convRate}% conversion rate`} />
                    <KpiCard label="Avg Lead Score"   value={avgScore}         accent="#C8BFB0" sub="out of 100" />
                    <KpiCard label="Pending Approval" value={stats.pending}    accent={stats.pending>0?"#9B4A58":"#F2EEE7"} />
                    <KpiCard label="Aging 7d+"        value={agingCount}       accent={agingCount>0?"#C04040":"#F2EEE7"} />
                  </div>

                  {/* Charts row 1 */}
                  <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))",gap:16,marginBottom:16}}>
                    <ChartCard title="Leads by Month (last 6)">
                      <BarChart data={months} color="#B58C91" height={130} />
                    </ChartCard>
                    <ChartCard title="Leads by Status">
                      <BarChart data={byStatus} color="#C8BFB0" height={130} />
                    </ChartCard>
                  </div>

                  {/* Charts row 2 */}
                  <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))",gap:16,marginBottom:16}}>
                    <ChartCard title="Top Business Types">
                      {byBtype.length ? <BarChart data={byBtype} color="#a78bfa" height={130} /> : <div style={{color:"#A79A8D",fontSize:12}}>No data yet</div>}
                    </ChartCard>
                    <ChartCard title="Leads by Tier">
                      <BarChart data={byTier} color="#34d399" height={130} />
                    </ChartCard>
                  </div>

                  {/* Agent performance table */}
                  {canSeeAll && byAgent.length>0 && (
                    <ChartCard title="Agent Performance">
                      <div style={{overflowX:"auto"}}>
                        <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
                          <thead>
                            <tr style={{borderBottom:"1px solid rgba(255,255,255,0.05)"}}>
                              {["Agent","Assigned","Contacted","Converted","Conv %"].map(h=>(
                                <th key={h} style={{textAlign:"left",padding:"6px 10px",color:"#A79A8D",fontSize:11,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.06em"}}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {teamMembers.filter(m=>m.role==="agent").map(m=>{
                              const aLeads   = leads.filter(l=>l.agent===m.name);
                              const aConv    = aLeads.filter(l=>l.status==="Converted").length;
                              const aCont    = aLeads.filter(l=>l.status==="Contacted").length;
                              const convPct  = aLeads.length>0 ? ((aConv/aLeads.length)*100).toFixed(0) : 0;
                              return (
                                <tr key={m.id} style={{borderBottom:"1px solid rgba(255,255,255,0.03)"}}>
                                  <td style={{padding:"9px 10px",color:"#F2EEE7",fontWeight:500}}>{m.name}</td>
                                  <td style={{padding:"9px 10px",color:"#C8BFB0"}}>{aLeads.length}</td>
                                  <td style={{padding:"9px 10px",color:"#C8BFB0"}}>{aCont}</td>
                                  <td style={{padding:"9px 10px",color:"#B58C91",fontWeight:600}}>{aConv}</td>
                                  <td style={{padding:"9px 10px"}}>
                                    <div style={{display:"flex",alignItems:"center",gap:8}}>
                                      <div style={{flex:1,height:5,background:"rgba(255,255,255,0.05)",borderRadius:3,maxWidth:80}}>
                                        <div style={{height:"100%",width:`${convPct}%`,background:"#B58C91",borderRadius:3}}/>
                                      </div>
                                      <span style={{fontSize:11,color:"#8A7678",minWidth:28}}>{convPct}%</span>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </ChartCard>
                  )}
                </div>
              );
            })()}

            {/* ── DEDUPLICATION PAGE ───────────────────────────── */}
            {activePage === "dedup" && (isAdmin || isAgent) && (() => {
              // Group leads by normalised name+location key
              const groups = {};
              leads.forEach(l => {
                const key = (l.name||"").trim().toLowerCase() + "||" + (l.location||"").trim().toLowerCase();
                if (!groups[key]) groups[key] = [];
                groups[key].push(l);
              });
              const dupGroups = Object.values(groups).filter(g => g.length > 1)
                .sort((a,b) => b.length - a.length);

              async function deleteDuplicates(group) {
                // Keep the oldest (first created), delete the rest
                const sorted = [...group].sort((a,b) => new Date(a.created_at) - new Date(b.created_at));
                const toDelete = sorted.slice(1);
                for (const l of toDelete) {
                  await supabase.from("leads").delete().eq("id", l.id);
                  await logAudit("Deleted duplicate lead", "lead", l.id, { name: l.name, location: l.location });
                }
                showToast(`Removed ${toDelete.length} duplicate${toDelete.length>1?"s":""}`, "success");
                fetchLeads();
              }

              async function deleteAllDuplicates() {
                setDeduping(true);
                let total = 0;
                for (const group of dupGroups) {
                  const sorted = [...group].sort((a,b) => new Date(a.created_at) - new Date(b.created_at));
                  const toDelete = sorted.slice(1);
                  for (const l of toDelete) {
                    await supabase.from("leads").delete().eq("id", l.id);
                    await logAudit("Deleted duplicate lead", "lead", l.id, { name: l.name, location: l.location });
                    total++;
                  }
                }
                setDeduping(false);
                showToast(`Cleaned ${total} duplicate lead${total!==1?"s":""}`, "success");
                fetchLeads();
              }

              return (
                <div>
                  <div className="page-header">
                    <div>
                      <div className="page-title">Deduplication</div>
                      <div className="page-sub">{dupGroups.length} duplicate group{dupGroups.length!==1?"s":""} found · {dupGroups.reduce((s,g)=>s+g.length-1,0)} leads to remove</div>
                    </div>
                    <div style={{display:"flex",gap:8}}>
                      <button className="btn" disabled={refreshing} onClick={handleRefresh}>{refreshing?"…":"↻ Refresh"}</button>
                      {dupGroups.length>0 && (
                        <button className="btn btn-danger" style={{background:"rgba(192,64,64,0.1)",borderColor:"rgba(192,64,64,0.3)",color:"#C04040"}} disabled={deduping} onClick={deleteAllDuplicates}>
                          {deduping?"Removing…":"⊗ Remove All Duplicates"}
                        </button>
                      )}
                    </div>
                  </div>

                  {dupGroups.length === 0 ? (
                    <div style={{textAlign:"center",padding:"60px 0",color:"#A79A8D",fontSize:14}}>
                      <div style={{fontSize:32,marginBottom:12}}>✓</div>
                      <div style={{fontWeight:600,color:"#8A7678"}}>No duplicates found</div>
                      <div style={{fontSize:12,marginTop:4}}>All leads have unique name + location combinations</div>
                    </div>
                  ) : (
                    <div style={{display:"flex",flexDirection:"column",gap:12}}>
                      {dupGroups.map((group, gi) => {
                        const sorted = [...group].sort((a,b) => new Date(a.created_at) - new Date(b.created_at));
                        const keep = sorted[0];
                        return (
                          <div key={gi} style={{background:"#2C1F22",border:"1px solid rgba(192,64,64,0.2)",borderRadius:12,padding:"14px 16px"}}>
                            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10,flexWrap:"wrap",gap:8}}>
                              <div>
                                <span style={{fontWeight:700,fontSize:14,color:"#F2EEE7"}}>{keep.name}</span>
                                <span style={{fontSize:12,color:"#A79A8D",marginLeft:8}}>{keep.location}</span>
                                <span style={{marginLeft:8,fontSize:11,background:"rgba(192,64,64,0.12)",color:"#C04040",borderRadius:99,padding:"2px 8px",fontWeight:600}}>{group.length} copies</span>
                              </div>
                              <button className="btn btn-danger" style={{fontSize:11,padding:"5px 12px",background:"rgba(192,64,64,0.08)",borderColor:"rgba(192,64,64,0.25)",color:"#C04040"}} onClick={()=>deleteDuplicates(group)}>
                                Keep oldest · delete {group.length-1}
                              </button>
                            </div>
                            <div style={{display:"flex",flexDirection:"column",gap:4}}>
                              {sorted.map((l,i) => (
                                <div key={l.id} style={{display:"flex",alignItems:"center",gap:10,padding:"6px 10px",borderRadius:7,background:i===0?"rgba(52,211,153,0.06)":"rgba(192,64,64,0.04)",border:`1px solid ${i===0?"rgba(52,211,153,0.15)":"rgba(192,64,64,0.1)"}`}}>
                                  <span style={{fontSize:10,fontWeight:700,color:i===0?"#34d399":"#C04040",minWidth:36}}>{i===0?"KEEP":"DEL"}</span>
                                  <span style={{fontSize:12,color:"#C8BFB0",flex:1}}>{l.business_type||"—"} · Score {l.score} · {l.status}</span>
                                  <span style={{fontSize:11,color:"#A79A8D"}}>{l.created_at?.slice(0,10)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* ── PIPELINE PAGE ─────────────────────────────────── */}
            {activePage === "pipeline" && (() => {
              const COLS = [
                { status:"New",        label:"New",        color:"#A79A8D", bg:"rgba(71,85,105,0.08)" },
                { status:"Assigned",   label:"Assigned",   color:"#C8BFB0", bg:"rgba(148,163,184,0.08)" },
                { status:"Contacted",  label:"Contacted",  color:"#C8BFB0", bg:"rgba(255,255,255,0.03)" },
                { status:"In Progress",label:"In Progress",color:"#a78bfa", bg:"rgba(167,139,250,0.08)" },
                { status:"Converted",  label:"Converted",  color:"#B58C91", bg:"rgba(181,140,145,0.08)" },
              ];
              return (
                <div>
                  <div className="page-header">
                    <div>
                      <div className="page-title">Pipeline</div>
                      <div className="page-sub">{leads.length} leads · drag cards to change status</div>
                    </div>
                    <button className="btn" disabled={refreshing} onClick={handleRefresh}>{refreshing?"…":"↻ Refresh"}</button>
                  </div>
                  <div style={{display:"flex",gap:12,overflowX:"auto",paddingBottom:16,minHeight:500}}>
                    {COLS.map(col => {
                      const colLeads = leads.filter(l => l.status === col.status);
                      const isOver   = dragOverCol === col.status;
                      return (
                        <div key={col.status}
                          onDragOver={e=>{ e.preventDefault(); setDragOverCol(col.status); }}
                          onDragLeave={()=>{ if(dragOverCol===col.status) setDragOverCol(null); }}
                          onDrop={()=>pipelineDrop(col.status)}
                          style={{
                            minWidth:220, flex:"1 1 220px", borderRadius:12,
                            background: isOver ? col.bg.replace("0.08","0.18") : col.bg,
                            border:`1.5px solid ${isOver ? col.color : "rgba(255,255,255,0.04)"}`,
                            transition:"all 0.15s", padding:12,
                          }}>
                          {/* Column header */}
                          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
                            <span style={{width:8,height:8,borderRadius:"50%",background:col.color,flexShrink:0,display:"inline-block"}}/>
                            <span style={{fontWeight:700,fontSize:12,color:col.color,textTransform:"uppercase",letterSpacing:"0.08em"}}>{col.label}</span>
                            <span style={{marginLeft:"auto",background:"rgba(255,255,255,0.06)",borderRadius:99,padding:"1px 8px",fontSize:11,color:"#8A7678",fontWeight:600}}>{colLeads.length}</span>
                          </div>
                          {/* Cards */}
                          <div style={{display:"flex",flexDirection:"column",gap:8}}>
                            {colLeads.map(lead => (
                              <div key={lead.id}
                                draggable
                                onDragStart={()=>setDragLeadId(lead.id)}
                                onDragEnd={()=>{ setDragLeadId(null); setDragOverCol(null); }}
                                onClick={()=>openLead(lead)}
                                style={{
                                  background:"#2C1F22", border:"1px solid rgba(181,140,145,0.08)",
                                  borderRadius:9, padding:"10px 12px", cursor:"grab",
                                  opacity: dragLeadId===lead.id ? 0.4 : 1,
                                  transition:"opacity 0.15s",
                                  boxShadow:"0 1px 4px rgba(0,0,0,0.3)",
                                }}>
                                <div style={{fontWeight:600,fontSize:13,color:"#F2EEE7",marginBottom:4,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{lead.name}</div>
                                <div style={{fontSize:11,color:"#A79A8D",marginBottom:6,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{lead.business_type||"—"} · {lead.location||"—"}</div>
                                <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
                                  <span style={{fontSize:10,fontWeight:600,padding:"2px 6px",borderRadius:5,...tierColor(lead.tier)}}>{lead.tier}</span>
                                  <span style={{fontSize:10,color:"#8A7678",marginLeft:"auto"}}>⭐ {lead.score}</span>
                                </div>
                                {lead.agent && <div style={{fontSize:10,color:"#A79A8D",marginTop:5}}>👤 {lead.agent}</div>}
                              </div>
                            ))}
                            {colLeads.length===0 && (
                              <div style={{textAlign:"center",padding:"24px 0",fontSize:11,color:"#6B5558"}}>Drop leads here</div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            {/* ── LEADS PAGE ───────────────────────────────────── */}
            {/* ADMIN OVERVIEW PAGE */}
            {activePage === "overview" && isAdmin && (() => {
              const branches = [...new Set(teamMembers.map(m=>m.branch).filter(Boolean))];
              const bmList = teamMembers.filter(m=>m.role==="branch_manager");
              const agentList = teamMembers.filter(m=>m.role==="agent");
              return (
                <div>
                  <div className="page-header">
                    <div>
                      <div className="page-title">Overview</div>
                      <div className="page-sub">{bmList.length} branch manager{bmList.length!==1?"s":""} · {agentList.length} agent{agentList.length!==1?"s":""} · {leads.length} total leads</div>
                    </div>
                    <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                      {stats.pending>0&&<button className="btn" style={{borderColor:"rgba(155,74,88,0.3)",color:"#9B4A58"}} onClick={()=>setShowApprovals(true)}>⏳ {stats.pending} Pending</button>}
                      <button className="btn" disabled={refreshing} onClick={async()=>{setRefreshing(true);await fetchLeads();await fetchTeamMembers();setRefreshing(false);}}>{refreshing?"…":"↻"}</button>
                      <button className="btn" onClick={()=>setShowUserMgr(true)}>+ Add Member</button>
                    </div>
                  </div>
                  {/* Global KPIs — clickable drilldown */}
                  <div className="stat-grid" style={{marginBottom:20}}>
                    <div className="stat-card" style={{cursor:"pointer"}} onClick={()=>setOverviewDrill({title:"All Leads",leads})}><div className="stat-num">{leads.length}</div><div className="stat-lbl">Total Leads</div></div>
                    <div className="stat-card" style={{cursor:"pointer"}} onClick={()=>setOverviewDrill({title:"Converted Leads",leads:leads.filter(l=>l.status==="Converted")})}><div className="stat-num stat-accent">{stats.converted}</div><div className="stat-lbl">Converted</div></div>
                    <div className="stat-card" style={{cursor:"pointer"}} onClick={()=>setOverviewDrill({title:"Pending Approval",leads:leads.filter(l=>l.status==="Pending Approval")})}><div className="stat-num" style={{color:"#9B4A58"}}>{stats.pending}</div><div className="stat-lbl">Pending Approval</div></div>
                    <div className="stat-card" style={{cursor:"pointer"}} onClick={()=>setOverviewDrill({title:"Active Agents",leads:null,members:agentList})}><div className="stat-num">{agentList.length}</div><div className="stat-lbl">Active Agents</div></div>
                    <div className="stat-card" style={{cursor:"pointer"}} onClick={()=>setOverviewDrill({title:"Branch Managers",leads:null,members:bmList})}><div className="stat-num">{bmList.length}</div><div className="stat-lbl">Branch Managers</div></div>
                    <div className="stat-card"><div className="stat-num">{leads.length>0?Math.round(stats.converted/leads.length*100):0}%</div><div className="stat-lbl">Conversion Rate</div></div>
                  </div>
                  {/* Per-BM cards */}
                  <div style={{fontSize:11,fontWeight:700,color:"#A79A8D",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:10}}>Branch Managers</div>
                  <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:24}}>
                    {bmList.length===0&&<div style={{fontSize:13,color:"#A79A8D",padding:"16px 0"}}>No branch managers yet — add one via Team.</div>}
                    {bmList.map(bm=>{
                      const bmAgents = teamMembers.filter(m=>m.role==="agent"&&m.branch===bm.branch);
                      const bmLeads = leads.filter(l=>l.branch===bm.branch||bmAgents.some(a=>a.name===l.agent));
                      const bmConverted = bmLeads.filter(l=>l.status==="Converted").length;
                      const bmPending = bmLeads.filter(l=>l.status==="Pending Approval").length;
                      return (
                        <div key={bm.id} style={{background:"#1C1416",border:"1px solid rgba(255,255,255,0.06)",borderRadius:10,padding:"14px 16px"}}>
                          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:8}}>
                            <div>
                              <div style={{fontWeight:700,fontSize:14,color:"#F2EEE7"}}>{bm.name}</div>
                              <div style={{fontSize:11,color:"#A79A8D",marginTop:2}}>{bm.branch||"No branch"} · {bmAgents.length} agent{bmAgents.length!==1?"s":""}</div>
                            </div>
                            <div style={{display:"flex",gap:16}}>
                              <div style={{textAlign:"center",cursor:"pointer"}} onClick={()=>setOverviewDrill({title:`${bm.name} — All Leads`,leads:bmLeads})}><div style={{fontSize:18,fontWeight:700,color:"#F2EEE7"}}>{bmLeads.length}</div><div style={{fontSize:10,color:"#A79A8D"}}>Leads</div></div>
                              <div style={{textAlign:"center",cursor:"pointer"}} onClick={()=>setOverviewDrill({title:`${bm.name} — Converted`,leads:bmLeads.filter(l=>l.status==="Converted")})}><div style={{fontSize:18,fontWeight:700,color:"#B58C91"}}>{bmConverted}</div><div style={{fontSize:10,color:"#A79A8D"}}>Converted</div></div>
                              {bmPending>0&&<div style={{textAlign:"center",cursor:"pointer"}} onClick={()=>setOverviewDrill({title:`${bm.name} — Pending`,leads:bmLeads.filter(l=>l.status==="Pending Approval")})}><div style={{fontSize:18,fontWeight:700,color:"#9B4A58"}}>{bmPending}</div><div style={{fontSize:10,color:"#A79A8D"}}>Pending</div></div>}
                            </div>
                          </div>
                          {bmAgents.length>0&&(
                            <div style={{marginTop:10,display:"flex",flexWrap:"wrap",gap:6}}>
                              {bmAgents.map(a=>{
                                const aLeads=leads.filter(l=>l.agent===a.name).length;
                                const aConv=leads.filter(l=>l.agent===a.name&&l.status==="Converted").length;
                                return <div key={a.id} style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:6,padding:"6px 10px",fontSize:11}}>
                                  <span style={{color:"#C8BFB0",fontWeight:600}}>{a.name}</span>
                                  <span style={{color:"#A79A8D",marginLeft:6}}>{aLeads} leads · {aConv} converted</span>
                                </div>;
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  {/* Unassigned agents */}
                  {agentList.filter(a=>!a.branch).length>0&&(
                    <>
                      <div style={{fontSize:11,fontWeight:700,color:"#A79A8D",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:10}}>Unassigned Agents</div>
                      <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:20}}>
                        {agentList.filter(a=>!a.branch).map(a=>(
                          <div key={a.id} style={{background:"rgba(192,64,64,0.06)",border:"1px solid rgba(192,64,64,0.15)",borderRadius:6,padding:"6px 12px",fontSize:12,color:"#C04040"}}>{a.name} — no branch</div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              );
            })()}

            {activePage === "leads" && <div>
            {/* Page header */}
            <div className="page-header">
              <div>
                <div className="page-title">{isAgent?"My Leads":isBM?"Branch Leads":"All Leads"}</div>
                <div className="page-sub" style={{minHeight:"1.4em"}}>{filtered.length} of {leads.length} leads</div>
              </div>
              <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                {isBM && stats.pending>0 && (
                  <button className="btn" style={{borderColor:"rgba(155,74,88,0.3)",color:"#9B4A58"}} onClick={()=>setShowApprovals(true)}>
                    ⏳ Approvals <span style={{background:"#9B4A58",color:"#fff",borderRadius:99,padding:"1px 7px",fontSize:10,marginLeft:4}}>{stats.pending}</span>
                  </button>
                )}
                <button className="btn" onClick={exportCSV}>↓ Export</button>
                <button className="btn" disabled={refreshing} onClick={handleRefresh}>{refreshing?"…":"↻"}</button>
                {isAgent && <button className="btn btn-gold" onClick={()=>setShowAddLead(true)}>+ Add Lead</button>}
              </div>
            </div>

            {/* Stats */}
            <div className="stat-grid">
              <div className={`stat-card${!statClick&&!hasActiveFilters?" active":""}`} onClick={clearAllFilters}>
                <div className="stat-num">{leads.length}</div>
                <div className="stat-lbl">Total Leads</div>
              </div>
              <div className={`stat-card${statClick==="new"?" active":""}`} onClick={()=>handleStatClick("new")}>
                <div className="stat-num">{stats.newLeads}</div>
                <div className="stat-lbl">New</div>
              </div>
              <div className={`stat-card${statClick==="assigned"?" active":""}`} onClick={()=>handleStatClick("assigned")}>
                <div className="stat-num">{stats.assigned}</div>
                <div className="stat-lbl">Assigned</div>
              </div>
              <div className={`stat-card${statClick==="contacted"?" active":""}`} onClick={()=>handleStatClick("contacted")}>
                <div className="stat-num" style={{color:"#C8BFB0"}}>{stats.contacted}</div>
                <div className="stat-lbl">Contacted</div>
              </div>
              {canSeeAll && (
                <div className={`stat-card pending-card${statClick==="pending"?" active":""}`} onClick={()=>handleStatClick("pending")}>
                  <div className="stat-num" style={stats.pending>0?{color:"#9B4A58"}:{}}>{stats.pending}</div>
                  <div className="stat-lbl">Pending Approval</div>
                </div>
              )}
              <div className={`stat-card${statClick==="converted"?" active":""}`} onClick={()=>handleStatClick("converted")}>
                <div className="stat-num stat-accent">{stats.converted}</div>
                <div className="stat-lbl">Converted</div>
              </div>
              <div className={`stat-card aging-card${statClick==="aging"?" active":""}`} onClick={()=>handleStatClick("aging")}>
                <div className="stat-num" style={agingCount>0?{color:"#C04040"}:{}}>{agingCount}</div>
                <div className="stat-lbl">Aging {AGING_DAYS}d+</div>
              </div>
            </div>

            {/* Filters */}
            <div className="filters-card">
              <div className="filters-top">
                <span className="filters-label">Filters</span>
                {hasActiveFilters && <button className="clear-link" onClick={clearAllFilters}>Clear all</button>}
              </div>
              <div className="filters-grid">
                <input className="fi search-full" placeholder="Search name, phone, location…" value={search} onChange={e=>setSearch(e.target.value)} />
                <select className="fi" value={stateFilter} onChange={e=>setStateFilter(e.target.value)}>
                  <option value="">All states</option>
                  {NIGERIAN_STATES.map(s=><option key={s}>{s}</option>)}
                </select>
                <select className="fi" value={btypeFilter} onChange={e=>setBtypeFilter(e.target.value)}>
                  <option value="">All business types</option>
                  {BUSINESS_TYPES.map(b=><option key={b}>{b}</option>)}
                </select>
                <select className="fi" value={tierFilter} onChange={e=>setTierFilter(e.target.value)}>
                  <option value="">All tiers</option>
                  <option>Corporate</option><option>SME</option><option>Mass Market</option>
                </select>
                <select className="fi" value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}>
                  <option value="">All statuses</option>
                  <option>New</option><option>Assigned</option><option>Contacted</option><option>In Progress</option><option>Pending Approval</option><option>Converted</option>
                </select>
                <select className="fi" value={dateFilter} onChange={e=>setDateFilter(e.target.value)}>
                  {DATE_OPTIONS.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
            </div>

            {/* Bulk bar */}
            {selectedIds.size>0&&(
              <div className="bulk-bar">
                <span>{selectedIds.size} selected</span>
                {canSeeAll&&(
                  <select className="fi" style={{maxWidth:180}} disabled={bulkAssigning} onChange={async e=>{
                    const agent=e.target.value; if(!agent) return;
                    setBulkAssigning(true);
                    const ids=[...selectedIds];
                    for(const id of ids){ await supabase.from("leads").update({agent,status:"Assigned"}).eq("id",id); }
                    await logAudit("Bulk assigned","leads","bulk",{agent,count:ids.length});
                    setBulkAssigning(false);
                    showToast(`${ids.length} leads assigned to ${agent}`,"success");
                    setSelectedIds(new Set()); fetchLeads(); e.target.value="";
                  }}>
                    <option value="">{bulkAssigning?"Assigning…":"Bulk assign to…"}</option>
                    {teamMembers.filter(m=>m.role==="agent").map(m=><option key={m.id}>{m.name}</option>)}
                  </select>
                )}
                <button className="btn btn-danger" disabled={bulkDeleting} onClick={()=>setConfirmDelete(true)}>{bulkDeleting?"Deleting…":"Delete"}</button>
                <button className="btn" onClick={()=>setSelectedIds(new Set())}>Clear</button>
              </div>
            )}

            {/* Table */}
            <div className="table-card">
              <div className="table-head">
                <div style={{display:"flex",alignItems:"center"}}>
                  <span className="table-title">Lead Database</span>
                  <span className="lead-badge">{filtered.length}</span>
                </div>
                <span style={{fontSize:11,color:"#6B5558"}}>Tap a row to view details</span>
              </div>

              {/* Desktop table */}
              <div className="tbl-scroll">
                {loading ? <div className="empty-state"><div className="empty-icon">⊙</div>Loading…</div>
                : filtered.length===0 ? <div className="empty-state"><div className="empty-icon">◈</div>No leads found</div>
                : (
                  <table>
                    <thead>
                      <tr>
                        <th className="td-chk"><input type="checkbox" onChange={toggleSelectAll} checked={selectedIds.size===pageLeads.length&&pageLeads.length>0} /></th>
                        <th>Name</th><th>Phone</th><th>Location</th><th>Tier</th><th>Score</th><th>Business</th><th>Status</th><th>Agent</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pageLeads.map(l=>{
                        const tc=tierColor(l.tier);
                        const aging=isAging(l);
                        const isPending=l.status==="Pending Approval";
                        return (
                          <tr key={l.id} className={`${selectedIds.has(l.id)?"row-sel":""} ${aging?"row-aging":""} ${isPending?"row-pending":""}`} onClick={()=>openLead(l)}>
                            <td className="td-chk" onClick={e=>toggleSelect(l.id,e)}><input type="checkbox" checked={selectedIds.has(l.id)} onChange={()=>{}} /></td>
                            <td className="td-name">{l.name}{aging&&<span className="aging-tag">AGING</span>}</td>
                            <td style={{fontSize:11,whiteSpace:"nowrap"}}>{l.phone||"—"}</td>
                            <td style={{whiteSpace:"nowrap",fontSize:11}}>{l.location}</td>
                            <td><span className="pill" style={{background:tc.bg,color:tc.color}}>{l.tier}</span></td>
                            <td><div className="score-wrap"><div className="score-bar"><div className="score-fill" style={{width:`${l.score}%`}}/></div><span style={{fontSize:11,color:"#A79A8D",minWidth:22,textAlign:"right"}}>{l.score}</span></div></td>
                            <td style={{fontSize:11,whiteSpace:"nowrap",color:"#A79A8D"}}>{l.business_type||"—"}</td>
                            <td><span className="status-pill" style={{background:statusBg(l.status),color:statusColor(l.status)}}>{l.status}</span></td>
                            <td style={{fontSize:11,color:l.agent?"#8A7678":"#6B5558",whiteSpace:"nowrap"}}>{l.agent||"—"}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Mobile cards */}
              <div className="lead-cards">
                {loading ? <div className="empty-state">Loading…</div>
                : filtered.length===0 ? <div className="empty-state">No leads found</div>
                : pageLeads.map(l=>{
                  const tc=tierColor(l.tier);
                  const aging=isAging(l);
                  const isPending=l.status==="Pending Approval";
                  return (
                    <div key={l.id} className={`lead-card${aging?" lc-aging":""}${isPending?" lc-pending":""}`} onClick={()=>openLead(l)}>
                      <div className="lc-top">
                        <div>
                          <div className="lc-name">{l.name}{aging&&<span className="aging-tag">AGING</span>}</div>
                          <div className="lc-meta">
                            <span className="lc-tag">{l.location||"—"}</span>
                            {l.business_type&&<span className="lc-tag">{l.business_type}</span>}
                          </div>
                        </div>
                        <span className="status-pill" style={{background:statusBg(l.status),color:statusColor(l.status),flexShrink:0}}>{l.status}</span>
                      </div>
                      <div className="lc-bottom">
                        <span className="pill" style={{background:tc.bg,color:tc.color}}>{l.tier}</span>
                        <div className="score-wrap" style={{maxWidth:100}}>
                          <div className="score-bar"><div className="score-fill" style={{width:`${l.score}%`}}/></div>
                          <span style={{fontSize:11,color:"#A79A8D"}}>{l.score}</span>
                        </div>
                        <span style={{fontSize:11,color:"#A79A8D"}}>{l.agent||"Unassigned"}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pagination">
                <span className="pg-info">Showing {Math.min((page-1)*perPage+1,filtered.length)}–{Math.min(page*perPage,filtered.length)} of {filtered.length}</span>
                <div className="pg-btns">
                  <button className="pg-btn" disabled={page===1} onClick={()=>setPage(p=>p-1)}>←</button>
                  {Array.from({length:Math.min(totalPages,7)},(_,i)=>(
                    <button key={i} className={`pg-btn${page===i+1?" pg-active":""}`} onClick={()=>setPage(i+1)}>{i+1}</button>
                  ))}
                  {totalPages>7&&<span style={{color:"#6B5558",fontSize:11,padding:"0 4px"}}>…{totalPages}</span>}
                  <button className="pg-btn" disabled={page===totalPages||totalPages===0} onClick={()=>setPage(p=>p+1)}>→</button>
                </div>
              </div>
            </div>
            </div>}
            {/* ── END LEADS PAGE ── */}

          </div>
        </div>
      </div>

      {/* CONFIRM DELETE */}
      {confirmDelete&&(
        <div className="confirm-overlay" onClick={e=>e.target===e.currentTarget&&setConfirmDelete(false)}>
          <div className="confirm-box">
            <div className="confirm-title">Delete {selectedIds.size} lead{selectedIds.size>1?"s":""}?</div>
            <div className="confirm-body">This action cannot be undone. These leads will be permanently removed from the database.</div>
            <div style={{display:"flex",gap:8}}>
              <button className="btn" style={{flex:1,justifyContent:"center"}} onClick={()=>setConfirmDelete(false)}>Cancel</button>
              <button className="btn btn-danger" style={{flex:1,justifyContent:"center",background:"rgba(192,64,64,0.1)"}} onClick={deleteSelected}>Delete</button>
            </div>
          </div>
        </div>
      )}


      {/* LEAD DETAIL DRAWER */}
      {selected&&(
        <>
          <div className="overlay" onClick={()=>{setSelected(null);setEditMode(false);}} />
          <div className="drawer">
            <div className="drawer-header">
              <span style={{fontSize:11,fontWeight:700,color:"#A79A8D",textTransform:"uppercase",letterSpacing:"0.08em"}}>{editMode?"Edit Lead":"Lead Detail"}</span>
              <button className="btn" style={{padding:"5px 10px"}} onClick={()=>{setSelected(null);setEditMode(false);}}>✕</button>
            </div>
            <div className="drawer-body">
              {editMode?(
                <>
                  <div className="form-grid">
                    {[["Name","name"],["Phone","phone"],["Location","location"],["Income","income"],["Business Type","business_type"]].map(([label,key])=>(
                      <div className="form-group" key={key} style={key==="name"||key==="business_type"?{gridColumn:"1/-1"}:{}}>
                        <label className="form-label">{label}</label>
                        <input className="form-input" value={editData[key]||""} onChange={e=>setEditData(p=>({...p,[key]:e.target.value}))} />
                      </div>
                    ))}
                    <div className="form-group">
                      <label className="form-label">Tier</label>
                      <select className="form-select" value={editData.tier||"SME"} onChange={e=>setEditData(p=>({...p,tier:e.target.value}))}>
                        <option>Corporate</option><option>SME</option><option>Mass Market</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Status</label>
                      <select className="form-select" value={editData.status||"New"} onChange={e=>setEditData(p=>({...p,status:e.target.value}))}>
                        <option>New</option><option>Assigned</option><option>Contacted</option><option>In Progress</option><option>Pending Approval</option><option>Converted</option>
                      </select>
                    </div>
                    {canSeeAll&&(
                      <div className="form-group">
                        <label className="form-label">Agent</label>
                        <select className="form-select" value={editData.agent||""} onChange={e=>setEditData(p=>({...p,agent:e.target.value}))}>
                          <option value="">— None —</option>
                          {teamMembers.filter(m=>m.role==="agent").map(m=><option key={m.id}>{m.name}</option>)}
                        </select>
                      </div>
                    )}
                    <div className="form-group">
                      <label className="form-label">Score</label>
                      <input className="form-input" type="number" min="0" max="100" value={editData.score||50} onChange={e=>setEditData(p=>({...p,score:e.target.value}))} />
                    </div>
                    <div className="form-group" style={{gridColumn:"1/-1"}}>
                      <label className="form-label">Notes</label>
                      <textarea className="form-textarea" value={editData.notes||""} onChange={e=>setEditData(p=>({...p,notes:e.target.value}))} />
                    </div>
                  </div>
                  <div style={{display:"flex",gap:8}}>
                    <button className="btn" onClick={()=>setEditMode(false)}>Cancel</button>
                    <button className="btn btn-gold" onClick={saveEdit} disabled={saving} style={{flex:2,justifyContent:"center"}}>{saving?"Saving…":"Save Changes"}</button>
                  </div>
                </>
              ):(
                <>
                  <div>
                    <div className="drawer-name">{selected.name}{isAging(selected)&&<span className="aging-tag">AGING</span>}</div>
                    <span className="status-pill" style={{background:statusBg(selected.status),color:statusColor(selected.status),marginTop:8,display:"inline-flex"}}>{selected.status}</span>
                  </div>
                  <div className="detail-tabs">
                    {["info","comments","history","followups"].map(t=>(
                      <button key={t} className={`dtab${detailTab===t?" active":""}`} onClick={()=>setDetailTab(t)}>
                        {t==="info"?"Info":t==="comments"?"Notes":t==="history"?"History":"Follow-ups"}
                      </button>
                    ))}
                  </div>

                  {detailTab==="info"&&(
                    <>
                      {[["Phone",selected.phone],["Location",selected.location],["Tier",selected.tier],["Business",selected.business_type],["Income",selected.income],["Score",`${selected.score}/100`],["Source",selected.source],["Agent",selected.agent||"—"],["Notes",selected.notes]].map(([label,value])=>value?(
                        <div className="drawer-row" key={label}>
                          <span className="dr-label">{label}</span>
                          <span className="dr-value">{value}</span>
                        </div>
                      ):null)}
                      <div style={{display:"flex",gap:7,flexWrap:"wrap"}}>
                        {/* Agents work their own leads */}
                        {isAgent&&(
                          selected.status==="Contacted"||selected.status==="Pending Approval"||selected.status==="Converted"
                          ? <button className="btn" disabled style={{flex:1,justifyContent:"center",opacity:0.45}}>✓ Contacted</button>
                          : <button className="btn" disabled={contactingLead} onClick={()=>markStatus("Contacted")} style={{flex:1,justifyContent:"center"}}>{contactingLead?"…":"Mark Contacted"}</button>
                        )}
                        {isAgent&&(
                          selected.status==="Pending Approval"
                          ? <button className="btn" disabled style={{flex:1,justifyContent:"center",opacity:0.45}}>⏳ Awaiting Approval</button>
                          : selected.status==="Converted"
                          ? <button className="btn" disabled style={{flex:1,justifyContent:"center",opacity:0.45}}>✓ Converted</button>
                          : <button className="btn" disabled={convertingLead} onClick={()=>markStatus("Converted")} style={{flex:1,justifyContent:"center"}}>{convertingLead?"…":"Request Convert"}</button>
                        )}
                      </div>
                      {/* BM and Admin can approve/reject */}
                      {canSeeAll&&selected.status==="Pending Approval"&&(
                        <div style={{display:"flex",gap:7}}>
                          <button className="btn" onClick={()=>approveConversion(selected.id)} style={{flex:1,justifyContent:"center"}}>✓ Approve</button>
                          <button className="btn btn-danger" onClick={()=>rejectConversion(selected.id)} style={{flex:1,justifyContent:"center"}}>✕ Reject</button>
                        </div>
                      )}
                      <div style={{display:"flex",gap:7}}>
                        <button className="btn" onClick={()=>{setEditMode(true);setEditData({...selected});}} style={{flex:1,justifyContent:"center"}}>Edit</button>
                        <button className="btn btn-danger" onClick={()=>deleteSingleLead(selected.id)} style={{flex:1,justifyContent:"center"}}>Delete</button>
                      </div>
                    </>
                  )}

                  {detailTab==="comments"&&(
                    <>
                      <div className="comment-list">
                        {comments.length===0&&<div style={{fontSize:12,color:"#6B5558",textAlign:"center",padding:"20px 0"}}>No notes yet</div>}
                        {comments.map(c=>(
                          <div className="comment-item" key={c.id}>
                            <div className="comment-meta">{c.user_name} · {new Date(c.created_at).toLocaleDateString()}</div>
                            <div className="comment-text">{c.comment}</div>
                          </div>
                        ))}
                      </div>
                      {!isAdmin&&(
                        <div style={{display:"flex",gap:7}}>
                          <input className="form-input" placeholder="Add a note…" value={newComment} onChange={e=>setNewComment(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addComment()} />
                          <button className="btn btn-gold" onClick={addComment}>Add</button>
                        </div>
                      )}
                    </>
                  )}

                  {detailTab==="history"&&(
                    <div className="history-list">
                      {leadHistory.length===0&&<div style={{fontSize:12,color:"#6B5558",textAlign:"center",padding:"20px 0"}}>No history yet</div>}
                      {leadHistory.map(h=>(
                        <div className="history-item" key={h.id}>
                          <span style={{color:"#8A7678",fontWeight:600}}>{h.field_changed}</span>: <span style={{color:"#A79A8D"}}>{h.old_value||"—"}</span> → <span style={{color:"#B58C91"}}>{h.new_value||"—"}</span>
                          <div style={{fontSize:10,color:"#6B5558",marginTop:3}}>{h.user_name} · {new Date(h.created_at).toLocaleDateString()}</div>
                        </div>
                      ))}
                    </div>
                  )}

                  {detailTab==="followups"&&(
                    <>
                      <div style={{display:"flex",flexDirection:"column",gap:6}}>
                        {followUps.length===0&&<div style={{fontSize:12,color:"#6B5558",textAlign:"center",padding:"12px 0"}}>No follow-ups set</div>}
                        {followUps.map(f=>(
                          <div key={f.id} className={`followup-item${f.done?" fu-done":""}${!f.done&&f.due_date<today?" overdue":""}`}>
                            <div style={{flex:1}}>
                              <div style={{fontSize:12,color:f.done?"#A79A8D":f.due_date<today?"#C04040":"#C8BFB0",fontWeight:600}}>{f.due_date}</div>
                              {f.note&&<div style={{fontSize:11,color:"#A79A8D",marginTop:2}}>{f.note}</div>}
                            </div>
                            {!f.done&&!isAdmin&&<button className="btn" style={{padding:"4px 8px",fontSize:11}} onClick={()=>markFollowUpDone(f.id)}>Done</button>}
                          </div>
                        ))}
                      </div>
                      {!isAdmin&&(
                        <div style={{display:"flex",flexDirection:"column",gap:7}}>
                          <input className="form-input" type="date" value={newFollowUp.due_date} onChange={e=>setNewFollowUp(p=>({...p,due_date:e.target.value}))} />
                          <input className="form-input" placeholder="Note (optional)" value={newFollowUp.note} onChange={e=>setNewFollowUp(p=>({...p,note:e.target.value}))} />
                          <button className="btn btn-gold" onClick={addFollowUp}>Set Follow-up</button>
                        </div>
                      )}
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </>
      )}

      {/* OVERVIEW DRILLDOWN MODAL */}
      {overviewDrill&&(
        <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&setOverviewDrill(null)}>
          <div className="modal" style={{maxWidth:680}} onClick={e=>e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">{overviewDrill.title}</span>
              <button className="btn" style={{padding:"5px 10px"}} onClick={()=>setOverviewDrill(null)}>✕</button>
            </div>
            <div className="modal-body" style={{maxHeight:"70vh",overflowY:"auto"}}>
              {overviewDrill.members ? (
                // Members drilldown
                <div style={{display:"flex",flexDirection:"column",gap:8}}>
                  {overviewDrill.members.length===0&&<div style={{color:"#A79A8D",fontSize:13,textAlign:"center",padding:"24px 0"}}>None yet</div>}
                  {overviewDrill.members.map(m=>{
                    const rc=roleColor(m.role);
                    const mLeads=leads.filter(l=>l.agent===m.name||l.branch===m.branch).length;
                    const mConverted=leads.filter(l=>(l.agent===m.name||l.branch===m.branch)&&l.status==="Converted").length;
                    return (
                      <div key={m.id} style={{background:"#1C1416",border:"1px solid rgba(255,255,255,0.05)",borderRadius:9,padding:"12px 14px",display:"flex",alignItems:"center",gap:12,flexWrap:"wrap"}}>
                        <div style={{flex:1}}>
                          <div style={{fontWeight:600,fontSize:13,color:"#F2EEE7"}}>{m.name}</div>
                          <div style={{fontSize:11,color:"#A79A8D",marginTop:2}}>{m.branch||"No branch"} · Joined {new Date(m.created_at).toLocaleDateString()}</div>
                        </div>
                        <span className="role-badge" style={{background:rc.bg,color:rc.color}}>{m.role.replace("_"," ")}</span>
                        <div style={{textAlign:"center"}}><div style={{fontSize:16,fontWeight:700,color:"#F2EEE7"}}>{mLeads}</div><div style={{fontSize:10,color:"#A79A8D"}}>Leads</div></div>
                        <div style={{textAlign:"center"}}><div style={{fontSize:16,fontWeight:700,color:"#B58C91"}}>{mConverted}</div><div style={{fontSize:10,color:"#A79A8D"}}>Converted</div></div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                // Leads drilldown
                <div style={{display:"flex",flexDirection:"column",gap:6}}>
                  {(overviewDrill.leads||[]).length===0&&<div style={{color:"#A79A8D",fontSize:13,textAlign:"center",padding:"24px 0"}}>No leads</div>}
                  {(overviewDrill.leads||[]).map(l=>(
                    <div key={l.id} style={{background:"#1C1416",border:"1px solid rgba(255,255,255,0.05)",borderRadius:8,padding:"10px 14px",cursor:"pointer"}} onClick={()=>{openLead(l);setOverviewDrill(null);}}>
                      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:8,flexWrap:"wrap"}}>
                        <div>
                          <div style={{fontWeight:600,fontSize:13,color:"#F2EEE7"}}>{l.name}</div>
                          <div style={{fontSize:11,color:"#A79A8D",marginTop:2}}>{l.location} · {l.business_type||"—"}</div>
                        </div>
                        <div style={{display:"flex",gap:8,alignItems:"center",flexShrink:0}}>
                          {l.agent&&<span style={{fontSize:11,color:"#C8BFB0"}}>{l.agent}</span>}
                          <span style={{fontSize:11,fontWeight:700,padding:"2px 8px",borderRadius:4,background:`${statusColor(l.status)}18`,color:statusColor(l.status),border:`1px solid ${statusColor(l.status)}30`}}>{l.status}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* FIND LEADS MODAL */}
      {showFindLeads&&(
        <div className="modal-overlay" onClick={e=>{ if(e.target===e.currentTarget&&!scrapeJob){setShowFindLeads(false);setScrapeDropdown({states:false,types:false,keywords:false});} else if(scrapeDropdown.states||scrapeDropdown.types||scrapeDropdown.keywords){setScrapeDropdown({states:false,types:false,keywords:false});} }}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Find Leads</span>
              {!scrapeJob&&<button className="btn" style={{padding:"5px 10px"}} onClick={()=>{setShowFindLeads(false);setScrapeDropdown({states:false,types:false,keywords:false});}}>✕</button>}
            </div>
            <div className="modal-body">
              {!scrapeJob?(
                <>
                  {/* STATES DROPDOWN */}
                  <div className="form-group" style={{position:"relative"}}>
                    <label className="form-label">States</label>
                    <button className="form-input" style={{display:"flex",justifyContent:"space-between",alignItems:"center",cursor:"pointer",textAlign:"left"}}
                      onClick={()=>setScrapeDropdown(d=>({...d,states:!d.states,types:false,keywords:false}))}>
                      <span style={{color:scrapeConfig.cities.length?"#DDD8D0":"#6B5558"}}>
                        {scrapeConfig.cities.length?`${scrapeConfig.cities.length} state${scrapeConfig.cities.length>1?"s":""} selected`:"Select states…"}
                      </span>
                      <span style={{color:"#A79A8D",fontSize:10}}>{scrapeDropdown.states?"▲":"▼"}</span>
                    </button>
                    {scrapeDropdown.states&&(
                      <div style={{position:"absolute",top:"100%",left:0,right:0,zIndex:50,background:"#2C1F22",border:"1px solid rgba(255,255,255,0.08)",borderRadius:8,marginTop:4,maxHeight:220,overflowY:"auto",boxShadow:"0 8px 32px rgba(0,0,0,0.5)"}}>
                        <div style={{padding:"8px 10px",borderBottom:"1px solid rgba(255,255,255,0.05)",display:"flex",gap:8}}>
                          <button style={{fontSize:11,color:"#B58C91",background:"none",border:"none",cursor:"pointer",fontFamily:"inherit"}} onClick={()=>setScrapeConfig(c=>({...c,cities:[...NIGERIAN_STATES]}))}>All</button>
                          <button style={{fontSize:11,color:"#A79A8D",background:"none",border:"none",cursor:"pointer",fontFamily:"inherit"}} onClick={()=>setScrapeConfig(c=>({...c,cities:[]}))}>None</button>
                        </div>
                        {NIGERIAN_STATES.map(s=>{
                          const on=scrapeConfig.cities.includes(s);
                          return <label key={s} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 12px",cursor:"pointer",background:on?"rgba(181,140,145,0.05)":"transparent",borderBottom:"1px solid rgba(255,255,255,0.03)"}}>
                            <input type="checkbox" checked={on} onChange={()=>setScrapeConfig(c=>({...c,cities:on?c.cities.filter(x=>x!==s):[...c.cities,s]}))} style={{accentColor:"#B58C91"}} />
                            <span style={{fontSize:13,color:on?"#B58C91":"#C8BFB0"}}>{s}</span>
                          </label>;
                        })}
                      </div>
                    )}
                  </div>

                  {/* BUSINESS TYPES DROPDOWN */}
                  <div className="form-group" style={{position:"relative"}}>
                    <label className="form-label">Business Types</label>
                    <button className="form-input" style={{display:"flex",justifyContent:"space-between",alignItems:"center",cursor:"pointer",textAlign:"left"}}
                      onClick={()=>setScrapeDropdown(d=>({...d,types:!d.types,states:false,keywords:false}))}>
                      <span style={{color:scrapeConfig.business_types.length?"#DDD8D0":"#6B5558"}}>
                        {scrapeConfig.business_types.length?`${scrapeConfig.business_types.length} type${scrapeConfig.business_types.length>1?"s":""} selected`:"Select business types…"}
                      </span>
                      <span style={{color:"#A79A8D",fontSize:10}}>{scrapeDropdown.types?"▲":"▼"}</span>
                    </button>
                    {scrapeDropdown.types&&(
                      <div style={{position:"absolute",top:"100%",left:0,right:0,zIndex:50,background:"#2C1F22",border:"1px solid rgba(255,255,255,0.08)",borderRadius:8,marginTop:4,maxHeight:220,overflowY:"auto",boxShadow:"0 8px 32px rgba(0,0,0,0.5)"}}>
                        <div style={{padding:"8px 10px",borderBottom:"1px solid rgba(255,255,255,0.05)",display:"flex",gap:8}}>
                          <button style={{fontSize:11,color:"#B58C91",background:"none",border:"none",cursor:"pointer",fontFamily:"inherit"}} onClick={()=>setScrapeConfig(c=>({...c,business_types:[...BUSINESS_TYPES],keywords_map:{}}))}>All</button>
                          <button style={{fontSize:11,color:"#A79A8D",background:"none",border:"none",cursor:"pointer",fontFamily:"inherit"}} onClick={()=>setScrapeConfig(c=>({...c,business_types:[],keywords_map:{}}))}>None</button>
                        </div>
                        {BUSINESS_TYPES.map(b=>{
                          const on=scrapeConfig.business_types.includes(b);
                          return <label key={b} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 12px",cursor:"pointer",background:on?"rgba(181,140,145,0.05)":"transparent",borderBottom:"1px solid rgba(255,255,255,0.03)"}}>
                            <input type="checkbox" checked={on} onChange={()=>setScrapeConfig(c=>{
                              const newTypes=on?c.business_types.filter(x=>x!==b):[...c.business_types,b];
                              const newKwMap={...c.keywords_map};
                              if(on)delete newKwMap[b];
                              return {...c,business_types:newTypes,keywords_map:newKwMap};
                            })} style={{accentColor:"#B58C91"}} />
                            <span style={{fontSize:13,color:on?"#B58C91":"#C8BFB0"}}>{b}</span>
                          </label>;
                        })}
                      </div>
                    )}
                  </div>

                  {/* KEYWORDS DROPDOWN — only if business types selected */}
                  {scrapeConfig.business_types.length>0&&(
                    <div className="form-group" style={{position:"relative"}}>
                      <label className="form-label">Keywords <span style={{color:"#A79A8D",fontWeight:400}}>(choose which search terms to use)</span></label>
                      <button className="form-input" style={{display:"flex",justifyContent:"space-between",alignItems:"center",cursor:"pointer",textAlign:"left"}}
                        onClick={()=>setScrapeDropdown(d=>({...d,keywords:!d.keywords,states:false,types:false}))}>
                        <span style={{color:"#DDD8D0"}}>
                          {Object.values(scrapeConfig.keywords_map).flat().length} keyword{Object.values(scrapeConfig.keywords_map).flat().length!==1?"s":""} selected
                        </span>
                        <span style={{color:"#A79A8D",fontSize:10}}>{scrapeDropdown.keywords?"▲":"▼"}</span>
                      </button>
                      {scrapeDropdown.keywords&&(
                        <div style={{position:"absolute",top:"100%",left:0,right:0,zIndex:50,background:"#2C1F22",border:"1px solid rgba(255,255,255,0.08)",borderRadius:8,marginTop:4,maxHeight:280,overflowY:"auto",boxShadow:"0 8px 32px rgba(0,0,0,0.5)",padding:12,display:"flex",flexDirection:"column",gap:12}}>
                          {scrapeConfig.business_types.map(btype=>{
                            const allKws=BUSINESS_KEYWORDS[btype]||[btype];
                            const selectedKws=scrapeConfig.keywords_map?.[btype]||[];
                            return (
                              <div key={btype}>
                                <div style={{fontSize:10,color:"#8A7678",fontWeight:700,marginBottom:6,textTransform:"uppercase",letterSpacing:"0.08em",display:"flex",justifyContent:"space-between"}}>
                                  {btype}
                                  <button style={{fontSize:10,color:"#B58C91",background:"none",border:"none",cursor:"pointer",fontFamily:"inherit",textTransform:"none"}}
                                    onClick={()=>setScrapeConfig(c=>({...c,keywords_map:{...c.keywords_map,[btype]:allKws}}))}>Select all</button>
                                </div>
                                <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
                                  {allKws.map(kw=>{
                                    const on=selectedKws.includes(kw);
                                    return <button key={kw} className="kw-pill" style={{background:on?"rgba(181,140,145,0.1)":"transparent",borderColor:on?"rgba(181,140,145,0.3)":"rgba(255,255,255,0.06)",color:on?"#B58C91":"#A79A8D"}}
                                      onClick={()=>setScrapeConfig(c=>{
                                        const cur=c.keywords_map?.[btype]||[];
                                        const updated=on?cur.filter(k=>k!==kw):[...cur,kw];
                                        return {...c,keywords_map:{...c.keywords_map,[btype]:updated}};
                                      })}>{kw}</button>;
                                  })}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="form-group">
                    <label className="form-label">Max Total Leads</label>
                    <input type="number" min={1} max={500} className="form-input" value={scrapeConfig.max_total===0?"":scrapeConfig.max_total} onChange={e=>{const v=e.target.value; setScrapeConfig(c=>({...c,max_total:v===""?0:Math.max(1,parseInt(v)||0)}));}} onBlur={e=>{if(!scrapeConfig.max_total||scrapeConfig.max_total<1) setScrapeConfig(c=>({...c,max_total:50}));}} placeholder="e.g. 60" />
                    <span className="form-hint">Scraper stops exactly at this number — not more</span>
                  </div>
                  <div style={{display:"flex",gap:8}}>
                    <button className="btn btn-gold" style={{flex:1,justifyContent:"center"}} onClick={()=>{
                      // Validate keywords selected
                      const hasKeywords = scrapeConfig.business_types.every(b=>(scrapeConfig.keywords_map[b]||[]).length>0);
                      if(!hasKeywords) return showToast("Select at least one keyword per business type","error");
                      startScrape();
                    }}>Start Scraping</button>
                    <button className="btn" onClick={()=>{setShowFindLeads(false);setScrapeDropdown({states:false,types:false,keywords:false});}}>Cancel</button>
                  </div>
                </>
              ):(
                <div style={{background:"#1C1416",border:"1px solid rgba(255,255,255,0.05)",borderRadius:12,padding:20,display:"flex",flexDirection:"column",gap:14}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <span style={{fontWeight:700,color:"#F2EEE7",fontSize:14}}>{scrapeStatus?.status==="done"?"Complete":"Scraping…"}</span>
                    <span style={{fontSize:13,color:"#B58C91",fontWeight:700}}>{scrapeStatus?.added??0} <span style={{color:"#A79A8D",fontWeight:400}}>/ {scrapeConfig.max_total}</span></span>
                  </div>
                  <div className="progress-wrap"><div className="progress-fill" style={{width:`${scrapeStatus?.progress??0}%`}}/></div>
                  <div style={{fontSize:11,color:"#A79A8D"}}>{scrapeStatus?.progress??0}% complete</div>
                  {scrapeStatus?.status!=="done"&&scrapeStatus?.status!=="cancelled"&&<button className="btn btn-danger" onClick={cancelScrape}>Stop Scraping</button>}
                  {(scrapeStatus?.status==="done"||scrapeStatus?.status==="cancelled")&&<button className="btn btn-gold" onClick={()=>{setScrapeJob(null);setScrapeStatus(null);setShowFindLeads(false);}}>Done</button>}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ADD LEAD MODAL */}
      {showAddLead&&(
        <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&setShowAddLead(false)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Add New Lead</span>
              <button className="btn" style={{padding:"5px 10px"}} onClick={()=>setShowAddLead(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                <div className="form-group" style={{gridColumn:"1/-1"}}>
                  <label className="form-label">Business Name *</label>
                  <input className="form-input" placeholder="e.g. Chukwuemeka & Sons Supermarket" value={newLead.name} onChange={e=>setNewLead(p=>({...p,name:e.target.value}))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <input className="form-input" placeholder="08012345678" value={newLead.phone} onChange={e=>setNewLead(p=>({...p,phone:e.target.value}))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Location</label>
                  <input className="form-input" placeholder="Lekki, Lagos" value={newLead.location} onChange={e=>setNewLead(p=>({...p,location:e.target.value}))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Tier</label>
                  <select className="form-select" value={newLead.tier} onChange={e=>setNewLead(p=>({...p,tier:e.target.value}))}>
                    <option>Corporate</option><option>SME</option><option>Mass Market</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Score (0–100)</label>
                  <input className="form-input" type="number" min="0" max="100" value={newLead.score} onChange={e=>setNewLead(p=>({...p,score:e.target.value}))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Source</label>
                  <select className="form-select" value={newLead.source} onChange={e=>setNewLead(p=>({...p,source:e.target.value}))}>
                    <option>Manual</option><option>Google Maps</option><option>CAC Registry</option><option>Facebook</option><option>Referral</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Est. Income</label>
                  <input className="form-input" placeholder="e.g. ₦500k/month" value={newLead.income} onChange={e=>setNewLead(p=>({...p,income:e.target.value}))} />
                </div>
                <div className="form-group" style={{gridColumn:"1/-1"}}>
                  <label className="form-label">Business Type</label>
                  <input className="form-input" placeholder="e.g. Pharmacy" value={newLead.business_type} onChange={e=>setNewLead(p=>({...p,business_type:e.target.value}))} />
                </div>
                <div className="form-group" style={{gridColumn:"1/-1"}}>
                  <label className="form-label">Notes / Address</label>
                  <textarea className="form-textarea" value={newLead.notes} onChange={e=>setNewLead(p=>({...p,notes:e.target.value}))} />
                </div>
              </div>
              <div style={{display:"flex",gap:8}}>
                <button className="btn" onClick={()=>setShowAddLead(false)}>Cancel</button>
                <button className="btn btn-gold" onClick={saveLead} disabled={saving} style={{flex:2,justifyContent:"center"}}>{saving?"Saving…":"Save Lead"}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TEAM MODAL */}
      {showUserMgr&&canSeeAll&&(
        <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&setShowUserMgr(false)}>
          <div className="modal" style={{maxWidth:580}} onClick={e=>e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Team Management</span>
              <div style={{display:"flex",gap:6}}>
                <button className="btn" style={{padding:"5px 10px"}} disabled={refreshing} onClick={async()=>{setRefreshing(true);await fetchTeamMembers();setRefreshing(false);}}>{refreshing?"…":"↻"}</button>
                <button className="btn" style={{padding:"5px 10px"}} onClick={()=>setShowUserMgr(false)}>✕</button>
              </div>
            </div>
            <div className="modal-body">
              <div style={{background:"#1C1416",border:"1px solid rgba(255,255,255,0.05)",borderRadius:10,padding:16,display:"flex",flexDirection:"column",gap:12}}>
                <div style={{fontSize:11,fontWeight:700,color:"#8A7678",textTransform:"uppercase",letterSpacing:"0.08em"}}>Create New User</div>
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Full Name</label>
                    <input className="form-input" placeholder="e.g. Emeka Obi" value={newUser.name} onChange={e=>setNewUser(p=>({...p,name:e.target.value}))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email</label>
                    <input className="form-input" type="email" placeholder="agent@bank.com" value={newUser.email} onChange={e=>setNewUser(p=>({...p,email:e.target.value}))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Password</label>
                    <input className="form-input" type="password" placeholder="Min 8 characters" value={newUser.password} onChange={e=>setNewUser(p=>({...p,password:e.target.value}))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Role</label>
                    <select className="form-select" value={newUser.role} onChange={e=>setNewUser(p=>({...p,role:e.target.value}))}>
                      <option value="agent">Agent</option>
                      {isAdmin&&<option value="branch_manager">Branch Manager</option>}
                    </select>
                  </div>
                  {isAdmin?(
                    <div className="form-group" style={{gridColumn:"1/-1"}}>
                      <label className="form-label">Branch</label>
                      <input className="form-input" placeholder="e.g. Lagos Island, Abuja Central" value={newUser.branch} onChange={e=>setNewUser(p=>({...p,branch:e.target.value}))} />
                      <span className="form-hint">Required for Branch Managers. Agents inherit their BM's branch.</span>
                    </div>
                  ):isBM&&profile.branch?(
                    <div className="form-group" style={{gridColumn:"1/-1"}}>
                      <label className="form-label">Branch</label>
                      <input className="form-input" value={profile.branch} disabled style={{opacity:0.4}} />
                      <span className="form-hint">Agent will be assigned to your branch automatically.</span>
                    </div>
                  ):null}
                </div>
                {userError&&<div style={{fontSize:12,color:"#C04040",background:"rgba(192,64,64,0.08)",border:"1px solid rgba(192,64,64,0.15)",borderRadius:7,padding:"9px 12px"}}>{userError}</div>}
                {userSuccess&&<div style={{fontSize:12,color:"#B58C91",background:"rgba(181,140,145,0.08)",border:"1px solid rgba(181,140,145,0.2)",borderRadius:7,padding:"9px 12px"}}>{userSuccess}</div>}
                <button className="btn btn-gold" onClick={createUser} disabled={creatingUser}>{creatingUser?"Creating…":"Create User"}</button>
              </div>
              <div style={{fontSize:11,fontWeight:700,color:"#A79A8D",textTransform:"uppercase",letterSpacing:"0.08em"}}>Team Members ({teamMembers.length})</div>
              <div style={{display:"flex",flexDirection:"column",gap:6}}>
                {teamMembers.map(m=>{
                  const isEditing = editingMember?.id === m.id;
                  const rc = roleColor(m.role);
                  return (
                    <div key={m.id} style={{background:"#1C1416",border:`1px solid ${isEditing?"rgba(181,140,145,0.3)":"rgba(255,255,255,0.05)"}`,borderRadius:9,padding:"12px 14px"}}>
                      {isEditing ? (
                        <div style={{display:"flex",flexDirection:"column",gap:8}}>
                          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                            <input className="form-input" style={{flex:1,minWidth:120}} value={editingMember.name} onChange={e=>setEditingMember(p=>({...p,name:e.target.value}))} placeholder="Name" />
                            <input className="form-input" style={{flex:1,minWidth:120}} value={editingMember.branch||""} onChange={e=>setEditingMember(p=>({...p,branch:e.target.value}))} placeholder="Branch (optional)" />
                          </div>
                          <div style={{display:"flex",gap:6}}>
                            <button className="btn btn-gold" style={{fontSize:11,padding:"5px 12px"}} disabled={savingMember} onClick={saveMemberEdit}>{savingMember?"Saving…":"Save"}</button>
                            <button className="btn" style={{fontSize:11,padding:"5px 12px"}} onClick={()=>setEditingMember(null)}>Cancel</button>
                          </div>
                        </div>
                      ) : (
                        <div style={{display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
                          <div style={{flex:1,minWidth:0}}>
                            <div style={{fontWeight:600,fontSize:13,color:"#F2EEE7"}}>{m.name}</div>
                            <div style={{fontSize:11,color:"#A79A8D",marginTop:2}}>{m.branch||"No branch"} · {new Date(m.created_at).toLocaleDateString()}</div>
                          </div>
                          <span className="role-badge" style={{background:rc.bg,color:rc.color,flexShrink:0}}>{m.role.replace("_"," ")}</span>
                          <button className="btn" style={{fontSize:11,padding:"4px 10px",flexShrink:0}} onClick={()=>setEditingMember({id:m.id,name:m.name,branch:m.branch||"",role:m.role})}>Edit</button>
                          {isAdmin && m.role !== "admin" && (
                            <button className="btn btn-danger" style={{fontSize:11,padding:"4px 10px",flexShrink:0,background:"rgba(192,64,64,0.08)",borderColor:"rgba(192,64,64,0.25)",color:"#C04040"}} disabled={deletingMember===m.id} onClick={()=>deleteMember(m)}>{deletingMember===m.id?"…":"Delete"}</button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* APPROVALS MODAL */}
      {showApprovals&&canSeeAll&&(
        <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&setShowApprovals(false)}>
          <div className="modal" style={{maxWidth:560}} onClick={e=>e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Pending Approvals <span style={{fontSize:13,color:"#9B4A58"}}>({pendingApprovals.length})</span></span>
              <button className="btn" style={{padding:"5px 10px"}} onClick={()=>setShowApprovals(false)}>✕</button>
            </div>
            <div className="modal-body">
              {pendingApprovals.length===0?(
                <div style={{fontSize:13,color:"#A79A8D",textAlign:"center",padding:"32px 0"}}>No pending approvals</div>
              ):(
                <div style={{display:"flex",flexDirection:"column",gap:8}}>
                  {pendingApprovals.map(lead=>(
                    <div key={lead.id} style={{background:"#1C1416",border:"1px solid rgba(155,74,88,0.15)",borderRadius:10,padding:"14px 16px",display:"flex",flexDirection:"column",gap:10}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8}}>
                        <div>
                          <div style={{fontSize:13,fontWeight:700,color:"#F2EEE7"}}>{lead.name}</div>
                          <div style={{fontSize:11,color:"#A79A8D",marginTop:3}}>{lead.business_type||"—"} · {lead.location} · <span style={{color:"#8A7678"}}>Agent: {lead.agent||"—"}</span></div>
                        </div>
                        <span style={{fontSize:10,background:"rgba(155,74,88,0.1)",color:"#9B4A58",border:"1px solid rgba(155,74,88,0.2)",borderRadius:4,padding:"3px 8px",whiteSpace:"nowrap",fontWeight:700}}>PENDING</span>
                      </div>
                      <div style={{display:"flex",gap:7}}>
                        <button className="btn" style={{flex:1,justifyContent:"center"}} onClick={()=>approveConversion(lead.id)}>✓ Approve</button>
                        <button className="btn btn-danger" style={{flex:1,justifyContent:"center"}} onClick={()=>rejectConversion(lead.id)}>✕ Reject</button>
                        <button className="btn" style={{padding:"8px 12px"}} onClick={()=>{setShowApprovals(false);openLead(lead);}}>View</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* LEADERBOARD MODAL */}
      {showLeaderboard&&(
        <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&setShowLeaderboard(false)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Agent Leaderboard</span>
              <button className="btn" style={{padding:"5px 10px"}} onClick={()=>setShowLeaderboard(false)}>✕</button>
            </div>
            <div className="modal-body">
              {leaderboard.length===0?(
                <div style={{fontSize:13,color:"#A79A8D",textAlign:"center",padding:"24px 0"}}>No agents yet</div>
              ):(
                <div style={{display:"flex",flexDirection:"column",gap:6}}>
                  {leaderboard.map((a,i)=>(
                    <div key={a.name} className="lb-row">
                      <div className={`lb-rank${i<3?" top":""}`}>#{i+1}</div>
                      <div style={{width:32,height:32,borderRadius:"50%",background:"rgba(181,140,145,0.1)",border:"1px solid rgba(181,140,145,0.2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,color:"#B58C91",flexShrink:0}}>{a.name[0].toUpperCase()}</div>
                      <div className="lb-name">{a.name}</div>
                      <div className="lb-stat">{a.assigned} assigned</div>
                      <div className="lb-converted">{a.converted}</div>
                    </div>
                  ))}
                </div>
              )}
              <div style={{fontSize:11,color:"#6B5558",textAlign:"center"}}>Ranked by number of conversions</div>
            </div>
          </div>
        </div>
      )}

      {/* TARGETS MODAL */}
      {showTargets&&canSeeAll&&(
        <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&setShowTargets(false)}>
          <div className="modal" style={{maxWidth:640}} onClick={e=>e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Performance Targets — {currentMonth}</span>
              <button className="btn" style={{padding:"5px 10px"}} onClick={()=>setShowTargets(false)}>✕</button>
            </div>
            <div className="modal-body">

              {/* SET NEW TARGET */}
              <div style={{background:"#1C1416",border:"1px solid rgba(255,255,255,0.05)",borderRadius:10,padding:16,marginBottom:16}}>
                <div style={{fontSize:11,fontWeight:700,color:"#A79A8D",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:12}}>Set Target</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr auto",gap:8,alignItems:"end"}}>
                  {isAdmin&&(
                    <div>
                      <div style={{fontSize:10,color:"#A79A8D",marginBottom:4}}>Branch</div>
                      <input className="fi" placeholder="e.g. Lagos Island" value={newTarget.branch} onChange={e=>setNewTarget(p=>({...p,branch:e.target.value}))} />
                    </div>
                  )}
                  <div>
                    <div style={{fontSize:10,color:"#A79A8D",marginBottom:4}}>Agent (optional)</div>
                    <select className="fi" value={newTarget.agent_name} onChange={e=>setNewTarget(p=>({...p,agent_name:e.target.value}))}>
                      <option value="">Whole branch</option>
                      {teamMembers.filter(m=>m.role==="agent"&&(!isBM||m.branch===profile.branch)).map(m=>(
                        <option key={m.id} value={m.name}>{m.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <div style={{fontSize:10,color:"#A79A8D",marginBottom:4}}>Target conversions</div>
                    <input className="fi" type="number" min="1" placeholder="e.g. 20" value={newTarget.target_count} onChange={e=>setNewTarget(p=>({...p,target_count:e.target.value}))} />
                  </div>
                  <button className="btn btn-gold" onClick={saveTarget} disabled={savingTarget} style={{whiteSpace:"nowrap"}}>
                    {savingTarget?"Saving…":"Set Target"}
                  </button>
                </div>
              </div>

              {/* TARGETS LIST WITH PROGRESS */}
              {targetsLoading?(
                <div style={{fontSize:13,color:"#A79A8D",textAlign:"center",padding:"24px 0"}}>Loading…</div>
              ):targets.length===0?(
                <div style={{fontSize:13,color:"#A79A8D",textAlign:"center",padding:"24px 0"}}>No targets set for {currentMonth} yet.</div>
              ):(
                <div style={{display:"flex",flexDirection:"column",gap:10}}>
                  {targets.map(t=>{
                    const scope = t.agent_name || t.branch || "All";
                    const actual = t.agent_name
                      ? leads.filter(l=>l.agent===t.agent_name&&l.status==="Converted").length
                      : leads.filter(l=>(!t.branch||l.branch===t.branch)&&l.status==="Converted").length;
                    const pct = Math.min(Math.round((actual/t.target_count)*100),100);
                    const color = pct>=100?"#B58C91":pct>=60?"#B58C91":"#C04040";
                    return (
                      <div key={t.id} style={{background:"#1C1416",border:"1px solid rgba(255,255,255,0.05)",borderRadius:10,padding:14}}>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                          <div>
                            <span style={{fontSize:13,fontWeight:700,color:"#DDD8D0"}}>{scope}</span>
                            {t.agent_name&&<span style={{marginLeft:6,fontSize:10,color:"#A79A8D",background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:4,padding:"1px 6px"}}>agent</span>}
                            {!t.agent_name&&t.branch&&<span style={{marginLeft:6,fontSize:10,color:"#A79A8D",background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:4,padding:"1px 6px"}}>branch</span>}
                          </div>
                          <div style={{display:"flex",alignItems:"center",gap:10}}>
                            <span style={{fontSize:12,fontWeight:700,color}}>{actual}/{t.target_count}</span>
                            <span style={{fontSize:11,color,fontWeight:600}}>{pct}%</span>
                            {isAdmin&&<button onClick={()=>deleteTarget(t.id)} style={{background:"none",border:"none",color:"#A79A8D",fontSize:14,cursor:"pointer",padding:"0 2px"}} title="Remove">✕</button>}
                          </div>
                        </div>
                        <div style={{height:6,background:"rgba(255,255,255,0.05)",borderRadius:3,overflow:"hidden"}}>
                          <div style={{height:"100%",width:`${pct}%`,background:color,borderRadius:3,transition:"width 0.4s"}} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* AUDIT LOG MODAL */}
      {showAuditLog&&canSeeAll&&(
        <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&(setShowAuditLog(false),setAuditSearch(""))}>
          <div className="modal" style={{maxWidth:640}} onClick={e=>e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Audit Log</span>
              <button className="btn" style={{padding:"5px 10px"}} onClick={()=>{setShowAuditLog(false);setAuditSearch("");}}>✕</button>
            </div>
            <div className="modal-body">
              {/* Search */}
              <div style={{marginBottom:12}}>
                <input className="form-input" placeholder="Search by action, person, lead name…" value={auditSearch} onChange={e=>setAuditSearch(e.target.value)} style={{width:"100%"}} />
              </div>
              {auditLoading?(
                <div style={{fontSize:13,color:"#A79A8D",textAlign:"center",padding:"24px 0"}}>Loading…</div>
              ):(()=>{
                const filtered = auditLogs.filter(log=>{
                  if(!auditSearch) return true;
                  const q=auditSearch.toLowerCase();
                  return (log.action||"").toLowerCase().includes(q)
                    ||(log.user_name||"").toLowerCase().includes(q)
                    ||(log.target_type||"").toLowerCase().includes(q)
                    ||JSON.stringify(log.details||{}).toLowerCase().includes(q);
                });
                // Group consecutive same-action entries by same user within 10 min
                const groups=[];
                for(const log of filtered){
                  const last=groups[groups.length-1];
                  const sameAction=last&&last.action===log.action&&last.user_name===log.user_name;
                  const within10m=last&&(new Date(last.logs[0].created_at)-new Date(log.created_at))<600000;
                  if(sameAction&&within10m){ last.logs.push(log); }
                  else{ groups.push({id:log.id,action:log.action,user_name:log.user_name,logs:[log]}); }
                }
                return filtered.length===0?(
                  <div style={{fontSize:13,color:"#A79A8D",textAlign:"center",padding:"24px 0"}}>
                    {auditSearch?"No results for that search":"No activity yet"}
                  </div>
                ):(
                  <div style={{display:"flex",flexDirection:"column",gap:6,maxHeight:480,overflowY:"auto"}}>
                    {groups.map(group=>{
                      const log=group.logs[0];
                      const d=log.details||{};
                      const leadName=d.name||d.to||d.email||"";
                      const dt=new Date(log.created_at);
                      const dateStr=dt.toLocaleDateString("en-NG",{day:"numeric",month:"short",year:"numeric"});
                      const timeStr=dt.toLocaleTimeString("en-NG",{hour:"2-digit",minute:"2-digit"});
                      const actionColor=log.action?.toLowerCase().includes("delet")?"#C04040":log.action?.toLowerCase().includes("approv")?"#B58C91":log.action?.toLowerCase().includes("reject")?"#9B4A58":"#B58C91";
                      const isGrouped=group.logs.length>1;
                      const isExpanded=expandedAuditGroup===group.id;
                      return (
                        <div key={group.id} className="audit-item" style={{cursor:isGrouped?"pointer":undefined}} onClick={isGrouped?()=>setExpandedAuditGroup(isExpanded?null:group.id):undefined}>
                          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8}}>
                            <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap",flex:1}}>
                              <span style={{fontSize:11,fontWeight:700,color:actionColor,background:`${actionColor}18`,border:`1px solid ${actionColor}30`,borderRadius:4,padding:"2px 7px",whiteSpace:"nowrap"}}>{log.action}</span>
                              {isGrouped&&<span style={{fontSize:11,fontWeight:700,color:"#B58C91",background:"rgba(181,140,145,0.12)",border:"1px solid rgba(181,140,145,0.25)",borderRadius:10,padding:"2px 8px"}}>×{group.logs.length} {isExpanded?"▲":"▼"}</span>}
                              {!isGrouped&&leadName&&<span style={{fontSize:11,color:"#DDD8D0",fontWeight:600}}>· {leadName}</span>}
                            </div>
                            <div style={{textAlign:"right",flexShrink:0}}>
                              <div style={{fontSize:10,color:"#A79A8D"}}>{dateStr}</div>
                              <div style={{fontSize:10,color:"#6B5558"}}>{timeStr}</div>
                            </div>
                          </div>
                          <div className="audit-meta" style={{marginTop:4}}>
                            <span style={{color:"#C8BFB0"}}>{log.user_name}</span>
                            {!isGrouped&&d.from&&d.to&&<span style={{color:"#A79A8D"}}> · {d.from} → {d.to}</span>}
                            {!isGrouped&&d.count&&<span style={{color:"#A79A8D"}}> · {d.count} leads</span>}
                            {!isGrouped&&d.role&&<span style={{color:"#A79A8D"}}> · role: {d.role}</span>}
                            {isGrouped&&<span style={{color:"#A79A8D"}}> · {group.logs.length} actions</span>}
                          </div>
                          {isGrouped&&isExpanded&&(
                            <div style={{marginTop:8,display:"flex",flexDirection:"column",gap:4,paddingLeft:8,borderLeft:"2px solid rgba(181,140,145,0.2)"}}>
                              {group.logs.map((sub,i)=>{
                                const sd=sub.details||{};
                                const sName=sd.name||sd.to||sd.email||sub.target_id||"";
                                const sTime=new Date(sub.created_at).toLocaleTimeString("en-NG",{hour:"2-digit",minute:"2-digit",second:"2-digit"});
                                return(
                                  <div key={sub.id||i} style={{fontSize:11,color:"#8A7678",display:"flex",gap:8}}>
                                    <span style={{color:"#A79A8D",flexShrink:0}}>{sTime}</span>
                                    {sName&&<span style={{color:"#C8BFB0"}}>{sName}</span>}
                                    {sd.from&&sd.to&&<span>{sd.from} → {sd.to}</span>}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      <div className={`toast${toast?" show":""} toast-${toastType}`}>{toast}</div>
    </>
  );
}
