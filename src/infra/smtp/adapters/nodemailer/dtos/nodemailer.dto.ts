export type NodemailerTransportOptions = {
  host: string;
  port: number;
  auth: {
    user: string;
    pass: string;
  };
};

export type NodemailerMailOptions = {
  from: string;
  to: string;
  subject: string;
  html: string;
};
