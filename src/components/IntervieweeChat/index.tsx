import { DeleteOutlined, UploadOutlined } from '@ant-design/icons';
import { Button, Card, Input, List, Popconfirm, Typography, Upload } from 'antd';
import { useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
    addChatMessage,
    clearCandidates,
    createCandidate,
    updateCandidateProfile
} from '../../store/slices/candidatesSlice';
import { findEmail, findName, findPhone } from '../../utils/extractors';
import { extractTextFromDocx, extractTextFromPdf } from '../../utils/pdfHelpers';

export default function IntervieweeChat() {
  const dispatch = useAppDispatch();
  const candidates = useAppSelector(s => s.candidates.list);

  const [currentId, setCurrentId] = useState<string | null>(null);
  const [chatInput, setChatInput] = useState('');
  useEffect(() => {
    if (candidates.length && !currentId) setCurrentId(candidates[0].id);
  }, [candidates]);

  const candidate = currentId ? candidates.find(c => c.id === currentId) : null;

  const getNextMissingField = () => {
    if (!candidate) return null;
    if (!candidate.name) return 'name';
    if (!candidate.email) return 'email';
    if (!candidate.phone) return 'phone';
    return null;
  };
  const nextField = getNextMissingField();

  useEffect(() => {
    if (!currentId || !nextField) return;
    const lastMsg = candidate?.chat[candidate.chat.length - 1];
    if (!lastMsg || !lastMsg.text.includes(`please provide your ${nextField}`)) {
      dispatch(addChatMessage({
        id: currentId,
        msg: {
          id: uuidv4(),
          role: 'ai',
          text: `Hi! Please provide your ${nextField}.`,
          timestamp: new Date().toISOString()
        }
      }));
    }
  }, [currentId, nextField]);

  async function handleResume(file: File) {
    const ext = file.name.split('.').pop()?.toLowerCase();
    let text = '';
    if (ext === 'pdf') text = await extractTextFromPdf(file);
    else if (ext === 'docx') text = await extractTextFromDocx(file);
    else return;

    const name = findName(text) ?? undefined;
    const email = findEmail(text) ?? undefined;
    const phone = findPhone(text) ?? undefined;

    const id = uuidv4();
    dispatch(createCandidate({
      id,
      name,
      email,
      phone,
      chat: [],
      resumeFileName: file.name
    }));
    setCurrentId(id);
  }

  const handleSendMessage = () => {
    if (!currentId || !chatInput.trim()) return;

    dispatch(addChatMessage({
      id: currentId,
      msg: {
        id: uuidv4(),
        role: 'candidate',
        text: chatInput.trim(),
        timestamp: new Date().toISOString()
      }
    }));
    const newData: any = {};
    if (!candidate?.name) newData.name = chatInput.trim();
    else if (!candidate?.email) newData.email = chatInput.trim();
    else if (!candidate?.phone) newData.phone = chatInput.trim();

    if (Object.keys(newData).length) {
      dispatch(updateCandidateProfile({ id: currentId, data: newData }));
    }

    setChatInput('');
  };

  const handleDeleteCurrentCandidate = () => {
    if (!currentId) return;
    dispatch(clearCandidates());
    setCurrentId(null);
    setChatInput('');
  };

  return (
    <div style={{ display: 'flex', gap: 16 }}>
      <Card style={{ flex: 1 }}>
        <Typography.Title level={4}>Upload Resume</Typography.Title>

        <Upload
          beforeUpload={(file) => { handleResume(file as File); return false; }}
          maxCount={1}
          accept=".pdf,.docx"
          showUploadList={false}
        >
          <Button icon={<UploadOutlined />}>Upload PDF / DOCX</Button>
        </Upload>

        {currentId && (
          <Popconfirm
            title="Delete candidate?"
            onConfirm={handleDeleteCurrentCandidate}
            okText="Yes"
            cancelText="No"
          >
            <Button danger icon={<DeleteOutlined />} style={{ marginTop: 8, marginLeft: 8 }}>Delete</Button>
          </Popconfirm>
        )}

        <Typography.Title level={5} style={{ marginTop: 16 }}>Candidate Details</Typography.Title>
        <List
          dataSource={candidates}
          locale={{ emptyText: 'No candidate uploaded' }}
          renderItem={c => (
            <List.Item>
              <List.Item.Meta
                title={c.name ?? 'Unnamed Candidate'}
                description={
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <div>Email: {c.email ?? 'N/A'}</div>
                    <div>Phone: {c.phone ?? 'N/A'}</div>
                    <div>Resume: {c.resumeFileName ?? 'N/A'}</div>
                  </div>
                }
              />
            </List.Item>
          )}
        />
      </Card>
      <Card style={{ flex: 2, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <Typography.Title level={4}>Chat</Typography.Title>
        <div style={{ flex: 1, overflowY: 'auto', border: '1px solid #f0f0f0', padding: 8 }}>
          {candidate?.chat.map(msg => (
            <div key={msg.id} style={{ marginBottom: 6, textAlign: msg.role === 'ai' ? 'left' : 'right' }}>
              <strong>{msg.role === 'ai' ? 'Bot' : 'You'}:</strong> {msg.text}
            </div>
          ))}
        </div>

        {currentId && nextField && (
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <Input
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              placeholder={`Enter your ${nextField}...`}
              onPressEnter={handleSendMessage}
            />
            <Button type="primary" onClick={handleSendMessage}>Send</Button>
          </div>
        )}
      </Card>
    </div>
  );
}
