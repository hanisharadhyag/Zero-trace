from parsers.fortinet_parser import FortinetParser
from utils.file_reader import FileReader

def test_fortinet():

    config = FileReader.read(
        "sample_configs/fortinet_safe.conf"
    )

    device = FortinetParser().parse(config)

    assert device.vendor == "Fortinet"
