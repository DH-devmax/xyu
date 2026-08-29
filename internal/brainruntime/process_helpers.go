package brainruntime

import (
	"bufio"
	"context"
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"os"
	"os/exec"
	"strings"
	"time"
)

// waitProcess 等待 gateway 退出并在非主动关闭时更新 degraded 状态。
func (supervisor *Supervisor) waitProcess(process *exec.Cmd, done chan struct{}) {
	// waitErr 保存当前步骤的中间结果。
	waitErr := process.Wait()
	close(done)
	supervisor.mu.Lock()
	if supervisor.process != process || supervisor.intentionalStop {
		supervisor.mu.Unlock()
		return
	}
	supervisor.process = nil
	supervisor.processDone = nil
	// backendServer 保存待在锁外关闭的 MCP 服务，避免阻塞状态读写。
	backendServer := supervisor.mcpServer
	supervisor.mcpServer = nil
	supervisor.status.State = "degraded"
	supervisor.status.Healthy = false
	supervisor.status.LastError = trimDiagnostic(waitErr, supervisor.stderrTail)
	supervisor.status.UpdatedAt = time.Now().UnixMilli()
	supervisor.mu.Unlock()
	if backendServer != nil {
		backendServer.Close()
	}
}

// captureStderr 保存最近 stderr 尾部，仅用于本地诊断且限制长度。
func (supervisor *Supervisor) captureStderr(reader io.Reader) {
	// bytes 保存当前步骤的中间结果。
	bytes, _ := io.ReadAll(io.LimitReader(reader, 32*1024))
	supervisor.mu.Lock()
	supervisor.stderrTail = string(bytes)
	supervisor.mu.Unlock()
}

// killAndWait 发送 SIGTERM，超过短预算后再 SIGKILL，并等待 Wait 完成。
func (supervisor *Supervisor) killAndWait(process *exec.Cmd) {
	if process == nil || process.Process == nil {
		return
	}
	_ = process.Process.Signal(os.Interrupt)
	// done 保存当前步骤的中间结果。
	done := make(chan struct{})
	go func() {
		_ = process.Wait()
		close(done)
	}()
	select {
	case <-done:
	case <-time.After(defaultGatewayStopTimeout):
		_ = process.Process.Kill()
		<-done
	}
}

// scanLines 将 gateway stdout 切为有界单行回执。
func scanLines(reader io.Reader, lines chan<- string) {
	defer close(lines)
	// scanner 保存当前步骤的中间结果。
	scanner := bufio.NewScanner(reader)
	scanner.Buffer(make([]byte, 1024), 64*1024)
	for scanner.Scan() {
		lines <- scanner.Text()
	}
}

// waitReady 在启动预算内寻找合法 JSON ready 回执。
func waitReady(ctx context.Context, timeout time.Duration, lines <-chan string) (readyMessage, error) {
	// waitCtx 将调用方取消和本地启动预算合并。
	waitCtx, cancel := context.WithTimeout(ctx, timeout)
	defer cancel()
	for {
		select {
		case <-waitCtx.Done():
			return readyMessage{}, waitCtx.Err()
		// line、ok 保存当前步骤的中间结果。
		case line, ok := <-lines:
			if !ok {
				return readyMessage{}, errors.New("gateway stdout 在 ready 前关闭")
			}
			// ready 保存当前行尝试解析的启动回执。
			var ready readyMessage
			if json.Unmarshal([]byte(line), &ready) == nil && ready.Ready {
				return ready, nil
			}
		}
	}
}

// markDegraded 把传输错误写入脱敏状态并保留当前进程供下一次 Start 修复。
func (supervisor *Supervisor) markDegraded(err error) {
	supervisor.mu.Lock()
	supervisor.status.State = "degraded"
	supervisor.status.Healthy = false
	supervisor.status.LastError = trimDiagnostic(err, supervisor.stderrTail)
	supervisor.status.UpdatedAt = time.Now().UnixMilli()
	supervisor.mu.Unlock()
}

// newToken 生成进程级 bearer token。
func newToken() (string, error) {
	// raw 是 32 字节随机 token 原料。
	raw := make([]byte, 32)
	// err 保存当前步骤的中间结果。
	if _, err := rand.Read(raw); err != nil {
		return "", err
	}
	return hex.EncodeToString(raw), nil
}

// formatInt 将资源预算格式化为环境变量使用的十进制文本。
func formatInt(value int) string {
	return fmt.Sprintf("%d", value)
}

// trimDiagnostic 合并错误和 stderr 尾部并截断，避免输出请求内容或无限日志。
func trimDiagnostic(err error, stderr string) string {
	// parts 保存当前步骤的中间结果。
	parts := make([]string, 0, 2)
	if err != nil {
		parts = append(parts, err.Error())
	}
	// value 保存当前步骤的中间结果。
	if value := strings.TrimSpace(stderr); value != "" {
		parts = append(parts, value)
	}
	// result 保存当前步骤的中间结果。
	result := strings.Join(parts, "; ")
	if len(result) > 500 {
		return result[:500]
	}
	return result
}
