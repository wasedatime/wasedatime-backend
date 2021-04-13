import boto3
s3 = boto3.client('s3')

"""
    Get S3 file's URL
    Parameters
    ----------
    bucket: string
        S3 bucket name
    target_object_path: string
        file path inside bucket

    Returns
    ----------
    url: string
        Object's url inside bucket
    """
def get_public_url(bucket, target_object_path):
    bucket_location = s3.get_bucket_location(Bucket=bucket)
    location_constraint = bucket_location["LocationConstraint"];
    return f"https://{bucket}.s3-{location_constraint}.amazonaws.com/{target_object_path}"