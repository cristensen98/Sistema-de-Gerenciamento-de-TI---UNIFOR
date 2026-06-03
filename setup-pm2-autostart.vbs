' Script VBS para criar tarefa agendada do PM2 como Administrador
' Execute este arquivo como Administrador

Set objShell = CreateObject("Shell.Application")
Set varTask = objShell.CreateShortcut(CreateObject("WScript.Shell").SpecialFolders("Startup") & "\test.lnk")

Dim shell
Set shell = CreateObject("WScript.Shell")

' Caminho do script batch
Dim scriptPath
scriptPath = "D:\STI\start-pm2.cmd"

' Verifica se o script existe
Dim fso
Set fso = CreateObject("Scripting.FileSystemObject")
If Not fso.FileExists(scriptPath) Then
    MsgBox "Erro: Arquivo nao encontrado: " & scriptPath, 48, "Erro"
    WScript.Quit 1
End If

' Cria a tarefa usando schtasks
Dim cmd
cmd = "schtasks /create /tn ""PM2-STI-App"" /tr """ & scriptPath & _
      """ /sc onstart /ru SYSTEM /f"

Dim exec
Set exec = shell.Exec(cmd)
Dim output
output = exec.StdOut.ReadAll()
Dim errorOutput
errorOutput = exec.StdErr.ReadAll()

If exec.Status = 0 Then
    MsgBox "✓ Tarefa agendada criada com sucesso!" & vbCrLf & vbCrLf & _
           "PM2 iniciara automaticamente na proxima inicializacao do Windows.", _
           64, "Sucesso"
Else
    MsgBox "Tarefa criada (pode exigir privilegios administrativos)" & vbCrLf & vbCrLf & _
           "Se nao funcionou:" & vbCrLf & _
           "1. Abra Agendador de Tarefas (taskschd.msc)" & vbCrLf & _
           "2. Crie manualmente conforme instrucoes em SERVIDOR-24-7.md", _
           64, "Informacao"
End If

WScript.Quit 0
