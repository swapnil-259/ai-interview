import { Layout, Tabs } from 'antd';
import IntervieweeChat from './components/IntervieweeChat';
import InterviewerDashboard from './components/InterviewerDashboard';
const { Header, Content } = Layout;

export default function App() {
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ color: 'white', fontSize: 18 }}>AI Interview Assistant</Header>
      <Content style={{ padding: 24 }}>
        <Tabs defaultActiveKey="1" items={[
          { key: '1', label: 'Interviewee (Chat)', children: <IntervieweeChat /> },
          { key: '2', label: 'Interviewer (Dashboard)', children: <InterviewerDashboard /> },
        ]} />
      </Content>
    </Layout>
  );
}
