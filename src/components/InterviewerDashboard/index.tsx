import { CloseOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { Button, Card, Empty, Grid, List, Modal, Typography } from 'antd';
import { useState } from 'react';
import { useAppSelector } from '../../store/hooks';

const { useBreakpoint } = Grid;

export default function InterviewerDashboard() {
  const candidates = useAppSelector(s => s.candidates.list);
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const selectedCandidate = selectedCandidateId
    ? candidates.find(c => c.id === selectedCandidateId)
    : null;

  const screens = useBreakpoint();
  const isMobile = !screens.md;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        gap: 16,
        padding: 16,
        minHeight: '80vh',
      }}
    >
      <Card
        style={{
          width: isMobile ? '100%' : 300,
          marginBottom: isMobile ? 16 : 0,
          borderRadius: 8,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        }}
      >
        <Typography.Title level={4}>Candidates</Typography.Title>
        <List
          dataSource={candidates}
          locale={{ emptyText: 'No candidates available' }}
          renderItem={c => (
            <List.Item
              style={{
                cursor: 'pointer',
                backgroundColor: selectedCandidateId === c.id ? '#e6f7ff' : undefined,
                borderRadius: 6,
                padding: '8px 12px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
              onClick={() => setSelectedCandidateId(c.id)}
            >
              <div>
                <Typography.Text strong>{c.name ?? 'Unnamed Candidate'}</Typography.Text>
                <div style={{ fontSize: 12, color: '#555' }}>
                  Score: {c.score ?? 0}
                </div>
              </div>
              <Button
                type="text"
                icon={<InfoCircleOutlined />}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedCandidateId(c.id);
                  setModalVisible(true);
                }}
              />
            </List.Item>
          )}
        />
      </Card>
      <Card
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          position: 'relative',
          borderRadius: 8,
          backgroundColor: '#fff',
          color: '#111',
          minHeight: 300,
        }}
      >
        {selectedCandidate ? (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography.Title level={4} style={{ color: '#fff' }}>
                {selectedCandidate.name}'s Chat
              </Typography.Title>
              <Button
                type="text"
                icon={<CloseOutlined style={{ color: '#111' }} />}
                onClick={() => setSelectedCandidateId(null)}
              />
            </div>

            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: 12,
                borderRadius: 6,
                backgroundColor: '#fff',
              }}
            >
              {selectedCandidate.chat.length > 0 ? (
                selectedCandidate.chat.map(msg => (
                  <div
                    key={msg.id}
                    style={{
                      marginBottom: 8,
                      textAlign: msg.role === 'ai' ? 'left' : 'right',
                    }}
                  >
                    <strong>{msg.role === 'ai' ? 'Bot' : 'Candidate'}:</strong> {msg.text}
                  </div>
                ))
              ) : (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description="No chat messages yet"
                  style={{ color: '#fff', marginTop: 50 }}
                />
              )}
            </div>
          </>
        ) : (
          <div
            style={{
              flex: 1,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              color: '#aaa',
              fontSize: 18,
            }}
          >
            Select a candidate to view chat
          </div>
        )}
      </Card>
      {selectedCandidate && (
        <Modal
          title={`${selectedCandidate.name ?? 'Candidate'} Details`}
          open={modalVisible}
          onCancel={() => setModalVisible(false)}
          footer={null}
        >
          <p><strong>Name:</strong> {selectedCandidate.name ?? 'N/A'}</p>
          <p><strong>Email:</strong> {selectedCandidate.email ?? 'N/A'}</p>
          <p><strong>Phone:</strong> {selectedCandidate.phone ?? 'N/A'}</p>
          <p><strong>Resume:</strong> {selectedCandidate.resumeFileName ?? 'N/A'}</p>
          <p><strong>Score:</strong> {selectedCandidate.score ?? 0}</p>
          <p><strong>Test Completed:</strong> {selectedCandidate.testCompleted ? 'Yes' : 'No'}</p>
        </Modal>
      )}
    </div>
  );
}
