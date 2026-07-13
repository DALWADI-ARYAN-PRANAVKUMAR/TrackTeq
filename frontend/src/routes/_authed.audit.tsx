import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Download, Users, Truck, ShieldAlert, BadgeDollarSign, UserCog } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import type { AuditLog, AuditStats } from "@/lib/types";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/_authed/audit")({
  component: AuditLogsPage,
});

function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [stats, setStats] = useState<AuditStats | null>(null);
  const [loading, setLoading] = useState(true);
  const session = useStore((s) => s.session);

  useEffect(() => {
    async function load() {
      try {
        const data = await api.getAuditLogs();
        // Handle case where backend might still be serving old array format temporarily
        if (Array.isArray(data)) {
          setLogs(data);
          setStats(null);
        } else {
          setLogs(data.logs || []);
          setStats(data.stats || null);
        }
      } catch (e) {
        console.error("Failed to load audit logs", e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const downloadCSV = () => {
    const headers = ["ID,User,Email,Role,Joined,Login Time,Logout Time,Status"];
    const rows = logs.map((log) => {
      const login = log.login_time ? new Date(log.login_time).toLocaleString() : "N/A";
      const logout = log.logout_time ? new Date(log.logout_time).toLocaleString() : "N/A";
      const joined = log.joined ? new Date(log.joined).toLocaleDateString() : "N/A";
      const status = log.is_active ? "Active" : "Offline";
      return `${log.id},"${log.user_name}","${log.email}","${log.role}","${joined}","${login}","${logout}",${status}`;
    });
    
    const csvContent = "data:text/csv;charset=utf-8," + headers.concat(rows).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "audit_logs.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadPDF = () => {
    const doc = new jsPDF();
    doc.text("Audit Logs - Track-Teq", 14, 15);
    
    const tableColumn = ["User", "Email", "Role", "Joined", "Login Time", "Logout Time", "Status"];
    const tableRows = logs.map(log => [
      log.user_name,
      log.email,
      log.role,
      log.joined ? new Date(log.joined).toLocaleDateString() : "N/A",
      log.login_time ? new Date(log.login_time).toLocaleString() : "N/A",
      log.logout_time ? new Date(log.logout_time).toLocaleString() : "N/A",
      log.is_active ? "Active" : "Offline"
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 20,
    });
    
    doc.save("audit_logs.pdf");
  };

  if (session?.role !== "Admin") {
    return (
      <div className="p-8">
        <h2 className="text-xl font-semibold text-red-500">Access Denied</h2>
        <p className="text-muted-foreground mt-2">You do not have permission to view this page.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Audit Logs</h2>
          <p className="text-muted-foreground">Monitor user activity and platform usage.</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={downloadCSV}>
            <Download className="mr-2 h-4 w-4" /> CSV
          </Button>
          <Button variant="outline" onClick={downloadPDF}>
            <Download className="mr-2 h-4 w-4" /> PDF
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total_users || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fleet Managers</CardTitle>
            <UserCog className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.fleet_managers || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Drivers</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.drivers || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Safety Officers</CardTitle>
            <ShieldAlert className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.safety_officers || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Financial Analysts</CardTitle>
            <BadgeDollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.financial_analysts || 0}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Session History</CardTitle>
          <CardDescription>A complete log of all user logins and logouts across the platform.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Login Time</TableHead>
                <TableHead>Logout Time</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center">Loading logs...</TableCell>
                </TableRow>
              ) : logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center">No logs found.</TableCell>
                </TableRow>
              ) : (
                logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-medium">{log.user_name}</TableCell>
                    <TableCell>{log.email}</TableCell>
                    <TableCell className="capitalize">{log.role.replace("_", " ")}</TableCell>
                    <TableCell>{log.joined ? new Date(log.joined).toLocaleDateString() : "N/A"}</TableCell>
                    <TableCell>{log.login_time ? new Date(log.login_time).toLocaleString() : "N/A"}</TableCell>
                    <TableCell>{log.logout_time ? new Date(log.logout_time).toLocaleString() : "N/A"}</TableCell>
                    <TableCell>
                      {log.is_active ? (
                        <Badge variant="default" className="bg-green-500/10 text-green-500 hover:bg-green-500/20">Active</Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground">Offline</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
