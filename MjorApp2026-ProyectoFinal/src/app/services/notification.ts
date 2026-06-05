export interface INotification
{
    title: string,
    body: string,
    data? : {},
    segments?: string[],
    userIds?: string[]
}