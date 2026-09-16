from parsers.paloalto_parser import PaloAltoParser
from utils.file_reader import FileReader

def test_paloalto():

    xml = FileReader.read(
        "sample_configs/paloalto_safe.xml"
    )

    device = PaloAltoParser().parse(xml)

    assert device.hostname == "PA-01"
